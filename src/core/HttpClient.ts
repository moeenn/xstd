import type { AbstractLogger } from "#src/node/Logger.js"
import { type Option } from "./Option.js"
import { Results, type NilResult, type Result } from "./Result.js"
import { type ReadableStream } from "node:stream/web"

type RequestBody = Record<string, unknown> | FormData

export type HttpRequestMethod =
    | "GET"
    | "POST"
    | "PUT"
    | "PATCH"
    | "DELETE"
    | "OPTIONS"

type HttpResponseType = "text" | "json" | "blob"
const ResponseType: Record<HttpResponseType, HttpResponseType> = {
    text: "text",
    json: "json",
    blob: "blob",
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

    incrementRetryCount(): NilResult {
        if (this.#retries >= this.#maxRetries - 1) {
            return Results.err(`max number of retries (${this.#maxRetries}) exceeded`)
        }

        this.#retries++
        return Results.nil()
    }

    calculateRetryDelay(): number {
        const delay = Math.pow(2, this.#retries)
        const jitter = (delay / 3) + Math.random() * (delay / 3)
        return (delay + jitter) * 1_000
    }
}

export class HttpRequest {
    readonly url: URL
    #method: HttpRequestMethod
    #body: Option<RequestBody>
    #responseType: HttpResponseType
    #headers: Headers
    #timeout: number
    #retry: Option<RequestRetry>

    constructor(url: URL) {
        this.url = url
        this.#method = "GET"
        this.#body = null
        this.#responseType = ResponseType.json
        this.#timeout = 10_000 // 10 seconds.
        this.#retry = null
        this.#headers = new Headers({
            Accept: "application/json",
        })
    }

    get method(): HttpRequestMethod {
        return this.#method
    }

    get body(): Option<RequestBody> {
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

    get retry(): Option<RequestRetry> {
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

    setRetry(args: { maxRetries: number, retryStatusCode?: number }) {
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
    #logger?: AbstractLogger

    constructor(logger?: AbstractLogger) {
        this.#logger = logger
    }

    async #sendRequest(request: HttpRequest): Promise<{ result: Result<HttpResponse>, retry: boolean }> {
        let body: Option<string | FormData> = null

        if (request.body) {
            const rawBody = request.body
            if (rawBody instanceof FormData) {
                body = rawBody
            } else {
                const encoded = Results.of(() => JSON.stringify(rawBody))
                if (encoded.isError) {
                    return {
                        result: Results.wrap(
                            encoded,
                            "failed to json encode request body",
                        ),
                        retry: false,
                    }
                }

                body = encoded.value
            }
        }

        const res = await Results.ofPromise(
            fetch(request.url, {
                method: request.method,
                headers: request.headers,
                signal: AbortSignal.timeout(request.timeout),
                body: body ?? undefined,
            }),
        )

        if (res.isError) {
            return { result: Results.wrap(res, "request failed"), retry: true }
        }

        const statusCode = res.value.status
        if (request.retry && statusCode == request.retry.retryStatusCode) {
            return {
                result: Results.err(`retry status code ${statusCode} received`),
                retry: true,
            }
        }

        switch (request.responseType) {
            case ResponseType.text: {
                const data = await Results.ofPromise(res.value.text())
                if (data.isError) {
                    return {
                        result: Results.wrap(
                            data,
                            "failed to read response data as text",
                        ),
                        retry: false
                    }
                }
                return {
                    result: Results.ok(
                        new HttpResponse(statusCode, ResponseType.text, data.value),
                    ),
                    retry: false,
                }
            }

            case ResponseType.blob: {
                const data = await Results.ofPromise(res.value.blob())
                if (data.isError) {
                    return {
                        result: Results.wrap(
                            data,
                            "failed to read response data as binay blob",
                        ),
                        retry: false,
                    }
                }
                return {
                    result: Results.ok(
                        new HttpResponse(statusCode, ResponseType.blob, data.value),
                    ),
                    retry: false
                }
            }

            case ResponseType.json: {
                const responseJson = await Results.ofPromise(res.value.json())
                if (responseJson.isError) {
                    return {
                        result: Results.wrap(
                            responseJson,
                            "failed to parse response as json",
                        ),
                        retry: false,
                    }
                }

                const data = responseJson.value
                return {
                    result: Results.ok(
                        new HttpResponse(statusCode, ResponseType.json, data),
                    ),
                    retry: false,
                }
            }

            default: {
                return {
                    result: Results.err(
                        "unexpected response type: " + request.responseType,
                    ),
                    retry: false
                }
            }
        }
    }

    async send(request: HttpRequest): Promise<Result<HttpResponse>> {
        if (!request.retry) {
            const result = await this.#sendRequest(request)
            return result.result
        }

        const result = await this.#sendRequest(request)
        if (!result.retry) {
            return result.result
        }

        this.#logger?.info("retrying request", {
            url: request.url,
            method: request.method,
            retryCount: request.retry.retries + 1,
        })

        const delay = request.retry.calculateRetryDelay()

        // sleep.
        await new Promise(resolve => setTimeout(resolve, delay))
        const incrementRes = request.retry.incrementRetryCount()
        if (incrementRes.isError) {
            return incrementRes
        }

        // call self recursively.
        return this.send(request)
    }
}

// TODO: also incorporate exponential back-off.
export class HttpStreamClient {
    async stream(
        request: HttpRequest,
    ): Promise<Result<ReadableStream<unknown>>> {
        let body: Option<string | FormData> = null
        if (request.body) {
            const rawBody = request.body
            if (rawBody instanceof FormData) {
                body = rawBody
            } else {
                const encoded = Results.of(() => JSON.stringify(rawBody))
                if (encoded.isError) {
                    return Results.wrap(
                        encoded,
                        "failed to json encode request body",
                    )
                }

                body = encoded.value
            }
        }

        const res = await Results.ofPromise(
            fetch(request.url, {
                method: request.method,
                headers: request.headers,
                signal: AbortSignal.timeout(request.timeout),
                body: body ?? undefined,
            }),
        )

        if (res.isError) {
            return Results.wrap(res, "request failed")
        }

        if (!res.value.body) {
            return Results.err("empty response stream")
        }

        return Results.ok(res.value.body as ReadableStream)
    }
}
