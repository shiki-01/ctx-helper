import { APISchema, logStatus } from "@shiki-01/logstatus";
import { ipcMain } from "electron";
import { APIRecord } from "../types";

class MainAPIManager {
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
}

export const mainAPIManager = new MainAPIManager();
