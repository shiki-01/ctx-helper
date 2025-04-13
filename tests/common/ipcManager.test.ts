import { ipcManager } from '../../src/common/ipcManager'
import { ipcRenderer } from 'electron'

jest.mock('electron', () => ({
  ipcRenderer: {
    on: jest.fn(),
    removeListener: jest.fn(),
  },
}))

describe('ipcManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ipcManager.listeners.clear()
  })

  it('should register a listener with on()', () => {
    const mockListener = jest.fn()
    const unsubscribe = ipcManager.on('test-channel', mockListener)

    expect(ipcRenderer.on).toHaveBeenCalledWith(
      'test-channel',
      expect.any(Function)
    )
    expect(ipcManager.listeners.get('test-channel')).toContain(mockListener)

    const wrappedListener = (ipcRenderer.on as jest.Mock).mock.calls[0][1]
    wrappedListener({}, 'arg1', 'arg2')

    expect(mockListener).toHaveBeenCalledWith('arg1', 'arg2')

    unsubscribe()
    expect(ipcManager.listeners.get('test-channel')).toBeUndefined()
  })

  it('should remove a listener with off()', () => {
    const mockListener = jest.fn()
    ipcManager.on('test-channel', mockListener)

    ipcManager.off('test-channel', mockListener)

    expect(ipcRenderer.removeListener).toHaveBeenCalledWith(
      'test-channel',
      expect.any(Function)
    )
    expect(ipcManager.listeners.get('test-channel')).not.toBeUndefined()
  })

  it('should register a one-time listener with once()', () => {
    const mockListener = jest.fn()
    ipcManager.once('test-channel', mockListener)

    expect(ipcRenderer.on).toHaveBeenCalledWith(
      'test-channel',
      expect.any(Function)
    )

    const wrappedListener = (ipcRenderer.on as jest.Mock).mock.calls[0][1]
    wrappedListener({}, 'arg1', 'arg2')

    expect(mockListener).toHaveBeenCalledWith('arg1', 'arg2')

    expect(ipcManager.listeners.get('test-channel')).toBeUndefined()
  })

  it('should log an error when trying to remove a non-existent listener', () => {
    const logStatusSpy = jest.spyOn(require('../../src/common/utils'), 'logStatus')

    ipcManager.off('non-existent-channel', jest.fn())

    expect(logStatusSpy).toHaveBeenCalledWith(
      { code: 404, message: 'リスナーが見つかりません: non-existent-channel' },
      null,
      expect.any(Error)
    )
  })
})