import type { WebContents } from "electron"

/**
 * API のレスポンスのスキーマ
 * @template T API のレスポンスのデータの型
 */
type APIRecord<T> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: ((...args: any[]) => Promise<T>) | APIRecord<T>
}

type Status = {
    code: number
    message?: string,
}

/**
 * API のレスポンスのスキーマ
 */
type APISchema<T = object | null> = {
    status: Status
    data?: T
    error?: string | Error | unknown
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncFunction = (...args: any[]) => Promise<any>

type RecursiveAPI<T> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [K in keyof T]: T[K] extends (R: WebContents, ...args: infer P) => infer R
    ? (...args: P) => R
    : RecursiveAPI<T[K]>
}

type RecursiveListener<T> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [K in keyof T]: T[K] extends (...args: any[]) => any
    ? (...args: Parameters<T[K]>) => ReturnType<T[K]>
    : RecursiveListener<T[K]>
}

type StatusSchema = {
    SUCCESS: Record<number, { message: string }>
    WARN: Record<number, { message: string }>
    ERROR: Record<number, { message: string }>
}

export type { APIRecord, Status, APISchema, AsyncFunction, RecursiveAPI, RecursiveListener, StatusSchema }
