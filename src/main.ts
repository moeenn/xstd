import { HttpServer } from "./node/HttpServer.js"
import { JsonLogger } from "./node/Logger.js"
import { RunCluster } from "./node/Cluster.js"

const logger = new JsonLogger()
async function main() {
    const server = new HttpServer({ logger })
    {
        server.GET("/home", (ctx) => ctx.json(200, { message: "home page" }))
        server.GET("/about", (ctx) => ctx.json(200, { message: "about page" }))
    }

    const listenResult = server.listen()
    if (!listenResult.isValid) {
        logger.error(listenResult.error)
    }
}

RunCluster(logger, main)
