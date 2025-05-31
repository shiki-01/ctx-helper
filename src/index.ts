import { ipcManager } from './common/ipcManager/index.js';
import { mainAPIManager } from './main/index.js';
import { rendererAPIManager } from './preload/index.js';
import type { APIRecord, Status, APISchema, AsyncFunction, RecursiveAPI, RecursiveListener, StatusSchema } from './types/index.js';

export {
    ipcManager,
    mainAPIManager,
    rendererAPIManager
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
