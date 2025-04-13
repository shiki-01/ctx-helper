import { logStatus, statusSchemaManager } from '../../src/common/utils'
import type { Status, APISchema } from '../../src/types'

describe('StatusSchemaManager', () => {
  it('should return the correct schema', () => {
    const schema = statusSchemaManager.getSchema()
    expect(schema.SUCCESS[200]?.message).toBe('Success')
    expect(schema.ERROR[404]?.message).toBe('Not Found')
  })

  it('should update a status message', () => {
    statusSchemaManager.updateStatus('SUCCESS', 201, 'Created')
    const message = statusSchemaManager.getStatusMessage('SUCCESS', 201)
    expect(message).toBe('Created')
  })

  it('should remove a status', () => {
    statusSchemaManager.updateStatus('SUCCESS', 202, 'Accepted')
    statusSchemaManager.removeStatus('SUCCESS', 202)
    const message = statusSchemaManager.getStatusMessage('SUCCESS', 202)
    expect(message).toBeUndefined()
  })
})

describe('logStatus', () => {
  it('should log a success message', () => {
    const status: Status = { code: 200 }
    const result = logStatus(status, { data: 'test' })
    expect(result.status.code).toBe(200)
    expect(result.status.message).toBe('Success')
    expect(result.data).toEqual({ data: 'test' })
  })

  it('should log an error message', () => {
    const status: Status = { code: 404 }
    const result = logStatus(status, {}, 'Not Found')
    expect(result.status.code).toBe(404)
    expect(result.error).toBe('Not Found')
  })

  it('should log a warning message', () => {
    const status: Status = { code: 300 }
    const result = logStatus(status, { data: 'test' })
    expect(result.status.code).toBe(300)
    expect(result.status.message).toBe('Warning')
    expect(result.data).toEqual({ data: 'test' })
  })

  it('should handle an invalid status code', () => {
    const status: Status = { code: 999 }
    const result = logStatus(status)
    expect(result.status.code).toBe(999)
    expect(result.error).toBe('Internal Server Error')
  })
})