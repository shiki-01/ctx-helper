import { ipcRenderer } from 'electron'
import { v4 as uuid } from 'uuid'
import { logStatus } from './utils'

type Listener<T = unknown> = (...args: T[]) => void

const ipcManager = {
  listeners: new Map<string, Listener[]>(),

  on<T = unknown[]>(channel: string, listener: Listener<T>): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, [])
      console.log('this.listenerMap.set', channel)
    }

    const channelListeners = this.listeners.get(channel)!
    channelListeners.push(listener as Listener)

    const wrappedListener = ((_: Electron.IpcRendererEvent, ...args: T[]): void => {
      listener(...args)
    }) as Listener<unknown>

    ipcRenderer.on(channel, wrappedListener)

    return () => {
      this.off(channel, wrappedListener)
    }
  },

  off(channel: string, listener: Listener): void {
    console.log('off', channel, listener)
    const channelListeners = this.listeners.get(channel)
    console.log('channelListeners', channelListeners)
    if (channelListeners) {
      const index = channelListeners.indexOf(listener)
      console.log('index', index)
      if (index !== -1) {
        channelListeners.splice(index, 1)
      }

      if (channelListeners.length === 0) {
        this.listeners.delete(channel)
        console.log('channelListeners.length === 0')
      }
      console.log('this.listenerMap.delete', listener)
    } else {
      logStatus(
        { code: 404, message: `リスナーが見つかりません: ${channel}` },
        null,
        new Error(`リスナーが見つかりません: ${channel}`)
      )
    }
  },

  once<T = unknown[]>(channel: string, listener: Listener<T>): void {
    const wrappedListener = ((...args: T[]): void => {
      listener(...args)
      this.off(channel, wrappedListener)
    }) as Listener<unknown>
    this.on(channel, wrappedListener)
  }
}

export { ipcManager }
