import { ipcManager } from './common/ipcManager/index.js';
import { apiManager } from './preload/index.js';
import type { APIRecord, Status, APISchema, AsyncFunction, RecursiveAPI, RecursiveListener, StatusSchema } from './types/index.js';

export {
    ipcManager,
    apiManager,
}
export type {
    APIRecord,
    Status,
    APISchema,
    AsyncFunction,
    RecursiveAPI,
    RecursiveListener,
    StatusSchema
};
