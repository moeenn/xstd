import { JsonLogger } from "./node/Logger.js"
import { Context, HttpServer, Controller } from "./node/HttpServer.js"
import type { NilResult } from "./core/Result.js"

class PublicPagesController extends Controller {
    readonly prefix = "/"
    #logger = new JsonLogger()

    routes(): void {
        this.route("GET", "/", this.homePage.bind(this))
    }

    homePage(ctx: Context): NilResult {
        this.#logger.info("logging some random shit", {
            with: "some random data",
        })
        return ctx.json(200, { message: "home page" })
    }
}

class AuthController extends Controller {
    readonly prefix = "/auth"

    routes(): void {
        this.route("GET", "/login", AuthController.loginPage)
    }

    static loginPage(ctx: Context): NilResult {
        return ctx.json(200, { message: "login page" })
    }
}

function main() {
    const logger = new JsonLogger()
    const server = new HttpServer({ logger })

    server.addController(new PublicPagesController())
    server.addController(new AuthController())

    server.runCluster({ workers: "MAX" })
}

main()
