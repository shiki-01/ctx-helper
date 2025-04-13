import type { Status, APISchema, StatusSchema } from '../types'

class StatusSchemaManager {
    private schema: StatusSchema = {
        SUCCESS: {
            200: {
                message: 'Success'
            }
        },
        WARN: {
            300: {
                message: 'Warning'
            },
            301: {
                message: 'Redirect'
            },
            302: {
                message: 'Found'
            },
            304: {
                message: 'Not Modified'
            }
        },
        ERROR: {
            400: {
                message: 'Bad Request'
            },
            401: {
                message: 'Unauthorized'
            },
            403: {
                message: 'Forbidden'
            },
            404: {
                message: 'Not Found'
            },
            500: {
                message: 'Internal Server Error'
            }
        }
    };

    getSchema() {
        return this.schema;
    }

    getStatusMessage(type: keyof StatusSchema, code: number): string | undefined {
        return this.schema[type]?.[code]?.message;
    }

    updateStatus(type: keyof StatusSchema, code: number, message: string): void {
        if (!this.schema[type]) {
            this.schema[type] = {};
        }
        this.schema[type][code] = { message };
    }

    removeStatus(type: keyof StatusSchema, code: number): void {
        if (this.schema[type]) {
            delete this.schema[type][code];
            if (Object.keys(this.schema[type]).length === 0) {
                delete this.schema[type];
            }
        }
    }
}

const statusSchemaManager = new StatusSchemaManager();

/**
 * ステータスをログに出力する
 * @param message ログに出力するメッセージ
 * @param status ログに出力するステータス ('SUCCESS' または 'ERROR')
 * @param error エラーが発生した場合のエラーオブジェクトまたはエラーメッセージ (オプション)
 */
const logStatus = <T extends object | unknown>(
    status: Status,
    message: T = {} as T,
    error?: unknown
): APISchema<T> => {
    const statusSchema = statusSchemaManager.getSchema();

    const statusType = Object.keys(statusSchema).find(
        (key) => statusSchema[key as keyof StatusSchema]?.[status.code]
    );

    let logMessage = status.message;

    if (!logMessage) {
        if (statusType && statusSchema[statusType as keyof StatusSchema]?.[status.code]) {
            logMessage = statusSchema[statusType as keyof StatusSchema][status.code]?.message;
        } else {
            switch (statusType) {
                case 'SUCCESS':
                    logMessage = 'Success';
                    break;
                case 'WARN':
                    logMessage = 'Warning';
                    break;
                case 'ERROR':
                    logMessage = 'Error';
                    break;
                default:
                    logMessage = 'Unknown status';
                    break;
            }
        }
    }

    status = {
        code: status.code,
        message: logMessage
    }

    if (statusType === 'SUCCESS') {
        console.log(`[SUCCESS] ${logMessage}`);
        return { status, data: message };
    } else if (statusType === 'ERROR') {
        console.error(`[ERROR] ${logMessage}`);
        if (error) {
            const errorMessage = error instanceof Error ? error.message : error;
            console.error(`  └─ ${errorMessage}`);
            return { status, error: errorMessage };
        }
        return { status, error: logMessage };
    } else if (statusType === 'WARN') {
        console.warn(`[WARN] ${logMessage}`);
        return { status, data: message };
    } else {
        console.error(`[ERROR] Invalid status code: ${status.code}`);
        return { status, error: 'Internal Server Error' };
    }
}

export { logStatus, statusSchemaManager };
