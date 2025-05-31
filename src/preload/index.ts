import { ipcMain, ipcRenderer } from 'electron'
import type { APIRecord, APISchema, RecursiveAPI, RecursiveListener } from '../types'
import { logStatus } from '@shiki-01/logstatus'

class APIManager {
  private handlers: APIRecord<APISchema> = {}
  private listeners: APIRecord<APISchema> = {}

  /**
   * ハンドラを登録する
   * @param key ハンドラのキー
   * @param handler ハンドラ関数
   */
  registerHandler<T extends APISchema>(key: string, handler: (...args: unknown[]) => Promise<T>): void {
    this.handlers[key] = handler
    ipcMain.handle(`invoke-api:${key}`, async (event, ...args) => {
      try {
        return await handler(event.sender, ...args)
      } catch (err) {
        return logStatus({ code: 500, message: 'API の呼び出しに失敗しました' }, null, err)
      }
    })
  }

  /**
   * API のハンドラを一括登録する
   * @param apiObj API のハンドラ群
   * @param parentKey 親のキー
   */
  registerAPIHandlers<T>(apiObj: APIRecord<T>, parentKey = ''): void {
    for (const key in apiObj) {
      const fullKey = parentKey ? `${parentKey}.${key}` : key
      if (typeof apiObj[key] === 'function') {
        this.handlers[fullKey] = apiObj[key] as (...args: unknown[]) => Promise<APISchema>
        ipcMain.handle(`invoke-api:${fullKey}`, async (event, ...args) => {
          try {
            return await (apiObj[key] as (...args: unknown[]) => Promise<T>)(event.sender, ...args)
          } catch (err) {
            return logStatus({ code: 500, message: 'API の呼び出しに失敗しました' }, null, err)
          }
        })
      } else {
        this.registerAPIHandlers(apiObj[key] as APIRecord<T>, fullKey)
      }
    }
  }

  /**
   * リスナーを登録する
   * @param key リスナーのキー
   * @param listener リスナー関数
   */
  registerListener<T extends APISchema>(key: string, listener: (...args: unknown[]) => Promise<T>): void {
    this.listeners[key] = listener
    ipcMain.on(`on-api:${key}`, (_event, ...args) => {
      try {
        listener(...args)
      } catch (err) {
        console.error(`[ERROR] IPC Listener error: ${key}`, err)
      }
    })
  }

  /**
   * API のリスナーを一括登録する
   * @param apiObj API のリスナー群
   * @param parentKey 親のキー
   */
  registerAPIListeners<T>(apiObj: APIRecord<T>, parentKey = ''): void {
    for (const key in apiObj) {
      const fullKey = parentKey ? `${parentKey}.${key}` : key
      if (typeof apiObj[key] === 'function') {
        this.listeners[fullKey] = apiObj[key] as (...args: unknown[]) => Promise<APISchema>
        ipcMain.on(`on-api:${fullKey}`, (_event, ...args) => {
          try {
            (apiObj[key] as (...args: unknown[]) => void)(...args)
          } catch (err) {
            console.error(`[ERROR] IPC Listener error: ${fullKey}`, err)
          }
        })
      } else {
        this.registerAPIListeners(apiObj[key] as APIRecord<T>, fullKey)
      }
    }
  }

  /**
   * API のインボーカを作成する
   * @returns API のインボーカ
   */
  createAPIInvoker<T>(): RecursiveAPI<T> {
    const apiRenderer: { [key: string]: RecursiveAPI<T> | ((...args: unknown[]) => void) } = {}

    for (const key in this.handlers) {
      apiRenderer[key] = async (...args: unknown[]): Promise<APISchema> => {
        return ipcRenderer.invoke(`invoke-api:${key}`, ...args)
      }
    }

    return apiRenderer as RecursiveAPI<T>
  }

  /**
   * API のエミッターを作成する
   * @returns API のエミッター
   */
  createAPIEmitter<T>(): RecursiveListener<T> {
    const apiEmitter: { [key: string]: RecursiveListener<T> | ((...args: unknown[]) => void) } = {}

    for (const key in this.listeners) {
      apiEmitter[key] = (...args: unknown[]): void => {
        ipcRenderer.send(`on-api:${key}`, ...args)
      }
    }

    return apiEmitter as RecursiveListener<T>
  }
}

export const apiManager = new APIManager()
