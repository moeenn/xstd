import http from "node:http"
import path from "node:path"
import type { IncomingMessage, Server, ServerResponse } from "node:http"
import { Results, type NilResult, type Result } from "#src/core/Result.js"
import { JsonLogger, type AbstractLogger } from "./Logger.js"
import { Options } from "#src/core/Option.js"
import { Cluster, type ClusterWorkerCount } from "./Cluster.js"

export type HttpServerConfig = {
    host: string
    port: number
    logger: AbstractLogger
}

export type HttpRequestMethod =
    | "GET"
    | "POST"
    | "PUT"
    | "PATCH"
    | "DELETE"
    | "OPTIONS"

export class Context {
    req: IncomingMessage
    res: ServerResponse
    readonly url: string
    readonly method: HttpRequestMethod

    constructor(req: IncomingMessage, res: ServerResponse) {
        const url = Options.of(req?.url)
        if (!url.isPresent) {
            throw new Error("failed to identify request url")
        }

        const method = Options.of(req.method)
        if (!method.isPresent) {
            throw new Error("failed to identify request method")
        }

        const validatedMethod = Context.#parseHttpMethod(method.value)
        if (!validatedMethod.isValid) {
            throw new Error("invalid http method: " + validatedMethod.error)
        }

        this.req = req
        this.res = res
        this.url = url.value
        this.method = validatedMethod.value
    }

    static #parseHttpMethod(input: string): Result<HttpRequestMethod> {
        const valid = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]

        input = input.toUpperCase()
        if (!valid.includes(input)) {
            return Results.err(`invalid http method: ${input}`)
        }

        return Results.ok(input as HttpRequestMethod)
    }

    json(status: number, data: object): NilResult {
        const encoded = Results.of(() => JSON.stringify(data))
        if (!encoded.isValid) {
            return encoded
        }

        this.res
            .setHeader("Content-Type", "application/json")
            .writeHead(status)
            .end(encoded.value)

        return Results.nil()
    }
}

type ControllerRequestHandler = {
    method: HttpRequestMethod
    path: string
    handler: RequestHandler
}

export abstract class Controller {
    #registeredRequestHandlers: ControllerRequestHandler[] = []

    constructor() {
        this.#registeredRequestHandlers = []
        this.routes()
    }

    abstract readonly prefix: string
    abstract routes(): void

    route(
        method: HttpRequestMethod,
        pathValue: string,
        handler: RequestHandler,
    ) {
        this.#registeredRequestHandlers.push({
            method,
            path: pathValue,
            handler,
        })
    }

    getRegisteredRoutes(): ControllerRequestHandler[] {
        return this.#registeredRequestHandlers
    }
}

export class HttpError {
    readonly statusCode: number
    error: string

    constructor(statusCode: number, error: string) {
        this.statusCode = statusCode
        this.error = error
    }
}

// eslint-disable-next-line no-unused-vars
type RequestHandler = (ctx: Context) => NilResult

export class HttpServer {
    #host: string
    #port: number
    #logger: AbstractLogger
    #server: Server
    #requestHandlers: Map<string, RequestHandler>

    constructor(config?: Partial<HttpServerConfig>) {
        this.#host = config?.host ?? "0.0.0.0"
        this.#port = config?.port ?? 3_000
        this.#logger = config?.logger ?? new JsonLogger()
        this.#server = http.createServer(this.#coreRouter)
        this.#requestHandlers = new Map()
    }

    #reportError = (ctx: Context, error: HttpError): void => {
        const payload = { statusCode: error.statusCode, error: error.error }
        const responseOutput = ctx.json(error.statusCode, payload)
        if (responseOutput.isValid) return

        const rawJsonResponse = `{ "statusCode": ${error.statusCode}, "error": "${error.error}"`
        ctx.res
            .setHeader("Content-Type", "application/json")
            .writeHead(error.statusCode)
            .end(rawJsonResponse)
    }

    #coreRouter = (req: IncomingMessage, res: ServerResponse): void => {
        const ctxResult = Results.of(() => new Context(req, res))
        if (!ctxResult.isValid) {
            this.#logger.error("context error: " + ctxResult.error)
            res.setHeader("Content-Type", "application/json")
                .writeHead(500)
                .end(`{"error":"something went wrong"}`)

            return
        }

        const { url, method } = ctxResult.value
        this.#logger.info("incoming request", { method, url })

        const key = `${method} ${url}`.trim()
        const foundRequestHandler = Options.of(this.#requestHandlers.get(key))
        if (!foundRequestHandler.isPresent) {
            this.#logger.warn("not found", { url, method })
            return this.#reportError(
                ctxResult.value,
                new HttpError(404, "not found"),
            )
        }

        const actionResult = foundRequestHandler.value(ctxResult.value)
        if (!actionResult.isValid) {
            this.#logger.warn("error in handling request", {
                url,
                method,
                error: actionResult.error,
            })

            return this.#reportError(
                ctxResult.value,
                new HttpError(500, "something went wrong"),
            )
        }
    }

    addController(controller: Controller) {
        const registeredRoutes = controller.getRegisteredRoutes()
        for (const route of registeredRoutes) {
            const key = `${route.method} ${path.join(controller.prefix, route.path)}`
            if (this.#requestHandlers.has(key)) {
                throw new Error(
                    `path ${key} has been registered multiple times`,
                )
            }

            this.#logger.info("registered route", { key })
            this.#requestHandlers.set(key, route.handler)
        }
    }

    run(): NilResult {
        const output = Results.of(() =>
            this.#server.listen(this.#port, this.#host, () =>
                this.#logger.info("starting server", {
                    address: `${this.#host}:${this.#port}`,
                }),
            ),
        )

        if (!output.isValid) {
            return Results.err(`failed to start server: ` + output.error)
        }

        return Results.nil()
    }

    runAsCluster(options: { workers: ClusterWorkerCount }): void {
        const logger = this.#logger
        const entrypoint = async () => {
            const runResult = this.run()
            if (!runResult.isValid) {
                this.#logger.error("failed to start worker", {
                    error: runResult.error,
                })
            }
        }

        const cluster = new Cluster({ logger, workerCount: options.workers })
        cluster.start(entrypoint)
    }
}
