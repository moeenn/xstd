import type { HttpRequestMethod } from "#src/node/HttpServer.js"
import type { Any } from "./Types.js"
import { Options, type Option } from "./Option.js"
import { Results, type Result } from "./Result.js"

type RequestBody = Record<string, unknown> | FormData

export class HttpRequest {
    readonly url: URL
    #method: HttpRequestMethod
    #body: Option<RequestBody>
    #headers: Headers
    #timeout: number

    constructor(url: URL) {
        this.url = url
        this.#method = "GET"
        this.#body = Options.none()
        this.#headers = new Headers()
        this.#timeout = 10_000 // 10 seconds.
    }

    GET() {
        this.#method = "GET"
        return this
    }

    POST(body: RequestBody) {
        this.#method = "POST"
        this.#body = Options.some(body)
        return this
    }

    PUT(body: RequestBody) {
        this.#method = "PUT"
        this.#body = Options.some(body)
        return this
    }

    PATCH(body: RequestBody) {
        this.#method = "PATCH"
        this.#body = Options.some(body)
        return this
    }

    DELETE() {
        this.#method = "DELETE"
        return this
    }

    get method(): HttpRequestMethod {
        return this.#method
    }

    get body(): Option<RequestBody> {
        return this.#body
    }

    get headers(): Headers {
        return this.#headers
    }

    get timeout(): number {
        return this.#timeout
    }

    addHeader(key: string, value: string) {
        this.#headers.set(key, value)
        return this
    }

    setTimeout(timeout: number) {
        this.#timeout = timeout
        return this
    }
}

export const HttpResponseType = {
    Text: "Text",
    Json: "Json",
    Blob: "Blob",
} as const

export class HttpClient {
    async send(
        request: HttpRequest,
        responseType: keyof typeof HttpResponseType,
    ): Promise<Result<Any>> {
        if (responseType === HttpResponseType.Json) {
            request
                .addHeader("Content-Type", "application/json")
                .addHeader("Accept", "application/json")
        }

        let body: Option<string | FormData> = Options.none()
        if (request.body.isPresent) {
            const rawBody = request.body.value
            if (rawBody instanceof FormData) {
                body = Options.some(rawBody)
            } else {
                const encoded = Results.of(() => JSON.stringify(rawBody))
                if (!encoded.isValid) {
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

        if (!res.isValid) {
            return res
        }

        switch (responseType) {
            case HttpResponseType.Text:
                return Results.ofPromise(res.value.text())

            case HttpResponseType.Blob:
                return Results.ofPromise(res.value.blob())

            case HttpResponseType.Json:
                const responseJson = await Results.ofPromise(res.value.json())
                if (!responseJson.isValid) {
                    return Results.wrap(
                        responseJson,
                        "failed to parse response as json",
                    )
                }

                return Results.ok(responseJson.value)
        }
    }

    // TODO: make DRY.
    async stream(request: HttpRequest): Promise<Result<ReadableStream<Any>>> {
        let body: Option<string | FormData> = Options.none()
        if (request.body.isPresent) {
            const rawBody = request.body.value
            if (rawBody instanceof FormData) {
                body = Options.some(rawBody)
            } else {
                const encoded = Results.of(() => JSON.stringify(rawBody))
                if (!encoded.isValid) {
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

        if (!res.isValid) {
            return Results.wrap(res, "request failed")
        }

        if (!res.value.body) {
            return Results.err("empty response stream")
        }

        return Results.ok(res.value.body)
    }
}
