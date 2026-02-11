import type { AbstractLogger } from "#src/node/logger.ts"
import { Result, type option, type result, type resultp } from "./monads.ts"
import { type ReadableStream } from "node:stream/web"

type RequestBody = Record<string, unknown> | FormData

export type HttpRequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS"

type HttpResponseType = "text" | "json" | "blob"
const ResponseType: Record<HttpResponseType, HttpResponseType> = {
    text: "text",
    json: "json",
    blob: "blob",
}

class RetriesExceededError extends Error {
    constructor(maxRetries: number) {
        super(`max number of retries (${maxRetries}) exceeded`)
    }
}

class RequestRetry {
    #maxRetries: number
    #retries: number
    #retryStatusCode: number

    constructor(maxRetries: number, retryStatusCode = 429) {
        this.#maxRetries = maxRetries
        this.#retries = 0
        this.#retryStatusCode = retryStatusCode
    }

    get retries() {
        return this.#retries
    }

    get retryStatusCode() {
        return this.#retryStatusCode
    }

    incrementRetryCount() {
        if (this.#retries >= this.#maxRetries - 1) {
            throw new RetriesExceededError(this.#maxRetries)
        }

        this.#retries++
        return
    }

    calculateRetryDelay(): number {
        const delay = Math.pow(2, this.#retries)
        const jitter = delay / 3 + Math.random() * (delay / 3)
        return (delay + jitter) * 1_000
    }
}

export class HttpRequest {
    readonly url: URL
    #method: HttpRequestMethod
    #body: option<RequestBody>
    #responseType: HttpResponseType
    #headers: Headers
    #timeout: number
    #retry: option<RequestRetry>

    constructor(url: URL) {
        this.url = url
        this.#method = "GET"
        this.#body = undefined
        this.#responseType = ResponseType.json
        this.#timeout = 10_000 // 10 seconds.
        this.#retry = undefined
        this.#headers = new Headers({
            Accept: "application/json",
        })
    }

    get method(): HttpRequestMethod {
        return this.#method
    }

    get body(): option<RequestBody> {
        return this.#body
    }

    get responseType(): HttpResponseType {
        return this.#responseType
    }

    get headers(): Headers {
        return this.#headers
    }

    get timeout(): number {
        return this.#timeout
    }

    get retry(): option<RequestRetry> {
        return this.#retry
    }

    setTimeout(timeout: number) {
        this.#timeout = timeout
        return this
    }

    setResponseType(responseType: HttpResponseType) {
        this.#responseType = responseType
        switch (responseType) {
            case ResponseType.text:
                this.#headers.append("Accept", "text/html")
                break

            case ResponseType.json:
                this.#headers.append("Accept", "application/json")
                break
        }

        return this
    }

    addHeader(key: string, value: string) {
        this.#headers.set(key, value)
        return this
    }

    setMethod(method: HttpRequestMethod) {
        this.#method = method
        return this
    }

    setBody(body: RequestBody) {
        this.#body = body
        const isFormData = body instanceof FormData
        if (!isFormData) {
            // in case FormData, this header is set automatically.
            this.#headers.append("Content-Type", "application/json")
        }

        return this
    }

    setRetry(args: { maxRetries: number; retryStatusCode?: number }) {
        this.#retry = new RequestRetry(args.maxRetries, args.retryStatusCode)
        return this
    }
}

export class HttpResponse {
    readonly status: number
    readonly type: HttpResponseType
    readonly data: unknown

    constructor(status: number, responseType: HttpResponseType, data: unknown) {
        this.status = status
        this.type = responseType
        this.data = data
    }
}

export class HttpClient {
    #logger: option<AbstractLogger>

    constructor(args?: { logger?: AbstractLogger }) {
        this.#logger = args?.logger
    }

    async #sendRequest(
        request: HttpRequest,
    ): Promise<{ response: result<HttpResponse>; retry: boolean }> {
        let body: option<string | FormData>

        if (request.body) {
            const rawBody = request.body
            if (rawBody instanceof FormData) {
                body = rawBody
            } else {
                const encoded = Result.of(() => JSON.stringify(rawBody))
                if (encoded.isError) {
                    return {
                        response: Result.wrap(encoded, "failed to json encode request body"),
                        retry: false,
                    }
                }

                body = encoded.value
            }
        }

        const res = await Result.ofPromise(
            fetch(request.url, {
                method: request.method,
                headers: request.headers,
                signal: AbortSignal.timeout(request.timeout),
                body: body ?? null,
            }),
        )

        if (res.isError) {
            return {
                response: Result.wrap(res, "request failed"),
                retry: true,
            }
        }

        const statusCode = res.value.status
        if (request.retry && statusCode == request.retry.retryStatusCode) {
            return {
                response: Result.err(`retry status code ${statusCode} received`),
                retry: true,
            }
        }

        switch (request.responseType) {
            case ResponseType.text: {
                const data = await Result.ofPromise(res.value.text())
                if (data.isError) {
                    return {
                        response: Result.wrap(data, "failed to read response data as text"),
                        retry: false,
                    }
                }
                return {
                    response: Result.ok(
                        new HttpResponse(statusCode, ResponseType.text, data.value),
                    ),
                    retry: false,
                }
            }

            case ResponseType.blob: {
                const data = await Result.ofPromise(res.value.blob())
                if (data.isError) {
                    return {
                        response: Result.wrap(data, "failed to read response data as binay blob"),
                        retry: false,
                    }
                }
                return {
                    response: Result.ok(
                        new HttpResponse(statusCode, ResponseType.blob, data.value),
                    ),
                    retry: false,
                }
            }

            case ResponseType.json: {
                const responseJson = await Result.ofPromise(res.value.json())
                if (responseJson.isError) {
                    return {
                        response: Result.wrap(responseJson, "failed to parse response as json"),
                        retry: false,
                    }
                }

                const data = responseJson.value
                return {
                    response: Result.ok(new HttpResponse(statusCode, ResponseType.json, data)),
                    retry: false,
                }
            }

            default: {
                return {
                    response: Result.err("unexpected response type: " + request.responseType),
                    retry: false,
                }
            }
        }
    }

    async send(request: HttpRequest): Promise<HttpResponse> {
        if (!request.retry) {
            const resp = await this.#sendRequest(request)
            if (resp.response.isError) {
                throw resp.response.error
            }
            return resp.response.value
        }

        const result = await this.#sendRequest(request)
        if (!result.retry) {
            if (result.response.isError) {
                throw result.response.error
            }
            return result.response.value
        }

        this.#logger?.info("retrying request", {
            url: request.url,
            method: request.method,
            retryCount: request.retry.retries + 1,
        })

        const delay = request.retry.calculateRetryDelay()

        // sleep.
        await new Promise((resolve) => setTimeout(resolve, delay))
        request.retry.incrementRetryCount()

        // call self recursively.
        return this.send(request)
    }
}

// TODO: also incorporate exponential back-off.
export class HttpStreamClient {
    async stream(request: HttpRequest): resultp<ReadableStream<unknown>> {
        let body: option<string | FormData>
        if (request.body) {
            const rawBody = request.body
            if (rawBody instanceof FormData) {
                body = rawBody
            } else {
                const encoded = Result.of(() => JSON.stringify(rawBody))
                if (encoded.isError) {
                    return Result.wrap(encoded, "failed to json encode request body")
                }

                body = encoded.value
            }
        }

        const res = await Result.ofPromise(
            fetch(request.url, {
                method: request.method,
                headers: request.headers,
                signal: AbortSignal.timeout(request.timeout),
                body: body ?? null,
            }),
        )

        if (res.isError) {
            return Result.wrap(res, "request failed")
        }

        if (!res.value.body) {
            return Result.err("empty response stream")
        }

        return Result.ok(res.value.body as ReadableStream)
    }
}
