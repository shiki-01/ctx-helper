import { ipcRenderer } from "electron";
import type {
  APIRecord,
  APISchema,
  RecursiveAPI,
  RecursiveListener,
} from "../types/index.js";

export const rendererAPIManager =  {
  /**
   * API のインボーカを作成する
   * @param apiObj API のハンドラ群
   * @template T API のレスポンスのデータの型
   * @returns API のインボーカ
   */
  createAPIInvoker<T extends APIRecord<APISchema<any>>>(
    apiObj: T,
    parentKey = ""
  ): RecursiveAPI<T> {
    const createRecursive = (
      obj: APIRecord<APISchema<any>>,
      prefix = ""
    ): RecursiveAPI<T> => {
      const result: Record<string, any> = {};

      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === "function") {
          result[key] = async (...args: unknown[]): Promise<APISchema<any>> => {
            return ipcRenderer.invoke(`invoke-api:${fullKey}`, ...args);
          };
        } else {
          result[key] = createRecursive(
            obj[key] as APIRecord<APISchema<any>>,
            fullKey
          );
        }
      }

      return result as RecursiveAPI<T>;
    };

    return createRecursive(apiObj, parentKey);
  },

  /**
   * API のエミッターを作成する
   * @param apiObj API のハンドラ群（省略時は登録済みリスナーを使用）
   * @param parentKey 親のキー
   * @returns API のエミッター
   */
  createAPIEmitter<T extends APIRecord<any>>(
    apiObj: T,
    parentKey = ""
  ): RecursiveListener<T> {
    const createRecursive = (
      obj: APIRecord<any>,
      prefix = ""
    ): RecursiveListener<T> => {
      const result: Record<string, any> = {};

      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === "function") {
          result[key] = (...args: unknown[]): void => {
            ipcRenderer.send(`on-api:${fullKey}`, ...args);
          };
        } else {
          result[key] = createRecursive(obj[key] as APIRecord<any>, fullKey);
        }
      }

      return result as RecursiveListener<T>;
    };

    return createRecursive(apiObj, parentKey);
  }
}
