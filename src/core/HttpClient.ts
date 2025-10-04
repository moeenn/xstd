import { Options, type Option } from "./Option.js"
import { Results, type Result } from "./Result.js"
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

export class HttpRequest {
    readonly url: URL
    #method: HttpRequestMethod
    #body: Option<RequestBody>
    #responseType: HttpResponseType
    #headers: Headers
    #timeout: number

    constructor(url: URL) {
        this.url = url
        this.#method = "GET"
        this.#body = Options.none()
        this.#responseType = ResponseType.json
        this.#timeout = 10_000 // 10 seconds.
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
        this.#body = Options.some(body)
        const isFormData = body instanceof FormData
        if (!isFormData) {
            // in case FormData, this header is set automatically.
            this.#headers.append("Content-Type", "application/json")
        }

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
    async send(request: HttpRequest): Promise<Result<HttpResponse>> {
        let body: Option<string | FormData> = Options.none()

        if (!request.body.isAbsent) {
            const rawBody = request.body.value
            if (rawBody instanceof FormData) {
                body = Options.some(rawBody)
            } else {
                const encoded = Results.of(() => JSON.stringify(rawBody))
                if (encoded.isError) {
                    return Results.wrap(
                        encoded,
                        "failed to json encode request body",
                    )
                }

                body = Options.some(encoded.value)
            }
        }

        const res = await Results.ofPromise(
            fetch(request.url, {
                method: request.method,
                headers: request.headers,
                signal: AbortSignal.timeout(request.timeout),
                body: Options.orElse(body, undefined),
            }),
        )

        if (res.isError) {
            return Results.wrap(res, "request failed")
        }

        const statusCode = res.value.status
        switch (request.responseType) {
            case ResponseType.text: {
                const data = await Results.ofPromise(res.value.text())
                if (data.isError) {
                    return Results.wrap(
                        data,
                        "failed to read response data as text",
                    )
                }
                return Results.ok(
                    new HttpResponse(statusCode, ResponseType.text, data.value),
                )
            }

            case ResponseType.blob: {
                const data = await Results.ofPromise(res.value.blob())
                if (data.isError) {
                    return Results.wrap(
                        data,
                        "failed to read response data as binay blob",
                    )
                }
                return Results.ok(
                    new HttpResponse(statusCode, ResponseType.blob, data.value),
                )
            }

            case ResponseType.json: {
                const responseJson = await Results.ofPromise(res.value.json())
                if (responseJson.isError) {
                    return Results.wrap(
                        responseJson,
                        "failed to parse response as json",
                    )
                }

                const data = responseJson.value
                return Results.ok(
                    new HttpResponse(statusCode, ResponseType.json, data),
                )
            }

            default: {
                return Results.err(
                    "unexpected response type: " + request.responseType,
                )
            }
        }
    }
}

export class HttpStreamClient {
    async stream(
        request: HttpRequest,
    ): Promise<Result<ReadableStream<unknown>>> {
        let body: Option<string | FormData> = Options.none()
        if (!request.body.isAbsent) {
            const rawBody = request.body.value
            if (rawBody instanceof FormData) {
                body = Options.some(rawBody)
            } else {
                const encoded = Results.of(() => JSON.stringify(rawBody))
                if (encoded.isError) {
                    return Results.wrap(
                        encoded,
                        "failed to json encode request body",
                    )
                }

                body = Options.some(encoded.value)
            }
        }

        const res = await Results.ofPromise(
            fetch(request.url, {
                method: request.method,
                headers: request.headers,
                signal: AbortSignal.timeout(request.timeout),
                body: Options.orElse(body, undefined),
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
