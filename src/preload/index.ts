import { ipcMain, ipcRenderer } from "electron";
import type {
  APIRecord,
  APISchema,
  RecursiveAPI,
  RecursiveListener,
} from "../types/index.js";
import { logStatus } from "@shiki-01/logstatus";

class APIManager {
  /**
   * ハンドラを登録する
   * @param key ハンドラのキー
   * @param handler ハンドラ関数
   */
  registerHandler<T extends APISchema>(
    key: string,
    handler: (...args: unknown[]) => Promise<T>
  ): void {
    ipcMain.handle(`invoke-api:${key}`, async (event, ...args) => {
      try {
        return await handler(event.sender, ...args);
      } catch (err) {
        return logStatus(
          { code: 500, message: "API の呼び出しに失敗しました" },
          null,
          err
        );
      }
    });
  }

  /**
   * API のハンドラを一括登録する
   * @param apiObj API のハンドラ群
   * @param parentKey 親のキー
   */
  registerAPIHandlers<T extends APIRecord<APISchema<any>>>(
    apiObj: T,
    parentKey = ""
  ): void {
    const registerRecursive = (
      obj: APIRecord<APISchema<any>>,
      prefix = ""
    ): void => {
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === "function") {
          ipcMain.handle(`invoke-api:${fullKey}`, async (event, ...args) => {
            try {
              return await (
                obj[key] as (...args: unknown[]) => Promise<APISchema<any>>
              )(event.sender, ...args);
            } catch (err) {
              return logStatus(
                { code: 500, message: "API の呼び出しに失敗しました" },
                null,
                err
              );
            }
          });
        } else {
          registerRecursive(obj[key] as APIRecord<APISchema<any>>, fullKey);
        }
      }
    };

    registerRecursive(apiObj, parentKey);
  }

  /**
   * リスナーを登録する
   * @param key リスナーのキー
   * @param listener リスナー関数
   */
  registerListener<T extends APISchema>(
    key: string,
    listener: (...args: unknown[]) => Promise<T>
  ): void {
    ipcMain.on(`on-api:${key}`, (_event, ...args) => {
      try {
        listener(...args);
      } catch (err) {
        console.error(`[ERROR] IPC Listener error: ${key}`, err);
      }
    });
  }

  /**
   * API のリスナーを一括登録する
   * @param apiObj API のリスナー群
   * @param parentKey 親のキー
   */
  registerAPIListeners<T extends APIRecord<any>>(
    apiObj: T,
    parentKey = ""
  ): void {
    const registerRecursive = (obj: APIRecord<any>, prefix = ""): void => {
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === "function") {
          ipcMain.on(`on-api:${fullKey}`, (_event, ...args) => {
            try {
              (obj[key] as (...args: unknown[]) => void)(...args);
            } catch (err) {
              logStatus(
                {
                  code: 400,
                  message: `[ERROR] IPC Listener error: ${fullKey}`,
                },
                null,
                err
              );
            }
          });
        } else {
          registerRecursive(obj[key] as APIRecord<any>, fullKey);
        }
      }
    };

    registerRecursive(apiObj, parentKey);
  }

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
  }

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

export const apiManager = new APIManager();
