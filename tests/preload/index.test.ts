import { apiManager } from '../../src/preload'
import { ipcMain, ipcRenderer } from 'electron'

jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
  },
  ipcRenderer: {
    invoke: jest.fn(),
    send: jest.fn(),
  },
}))

describe('APIManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should register a handler and handle API calls', async () => {
    const mockHandler = jest.fn().mockResolvedValue({ status: { code: 200 }, data: 'test' })
    apiManager.registerHandler('testHandler', mockHandler)

    expect(ipcMain.handle).toHaveBeenCalledWith(
      'invoke-api:testHandler',
      expect.any(Function)
    )

    const mockEvent = {
        sender: {
            send: jest.fn(),
        },
    }

    const handler = (ipcMain.handle as jest.Mock).mock.calls[0][1]
    const result = await handler(mockEvent, 'arg1', 'arg2')

    expect(mockHandler).toHaveBeenCalledWith(mockEvent.sender, 'arg1', 'arg2')
    expect(result).toEqual({ status: { code: 200 }, data: 'test' })
  })

  it('should register a listener and handle events', () => {
    const mockListener = jest.fn()
    apiManager.registerListener('testListener', mockListener)

    expect(ipcMain.on).toHaveBeenCalledWith(
      'on-api:testListener',
      expect.any(Function)
    )

    const listener = (ipcMain.on as jest.Mock).mock.calls[0][1]
    listener({}, 'arg1', 'arg2')

    expect(mockListener).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('should create an API invoker', async () => {
    (ipcRenderer.invoke as jest.Mock).mockResolvedValue({ status: { code: 200 }, data: 'test' })

    const invoker = apiManager.createAPIInvoker<{ testHandler: () => Promise<{ status: { code: number }; data: string }> }>()
    const result = await invoker.testHandler()

    expect(ipcRenderer.invoke).toHaveBeenCalledWith('invoke-api:testHandler')
    expect(result).toEqual({ status: { code: 200 }, data: 'test' })
  })

  it('should create an API emitter', () => {
    const emitter = apiManager.createAPIEmitter<{ testListener: (arg: string) => void }>()
    emitter.testListener('testArg')

    expect(ipcRenderer.send).toHaveBeenCalledWith('on-api:testListener', 'testArg')
  })
})