import { setTimeout } from "node:timers/promises"
import { ExecutorService } from "./node/ExecutorService.js"
import { Future } from "./node/Future.js"
import { JsonLogger } from "./node/Logger.js"

function getRandomInt(max: number): number {
    return Math.floor(Math.random() * max)
}

async function main() {
    const logger = new JsonLogger()

    const executor = new ExecutorService<string>(3)
    for (let i = 0; i < 10; i++) {
        const ft = new Future(async (): Promise<string> => {
            logger.info("running #" + i)
            await setTimeout(getRandomInt(4_000))
            return `Result # ${i}`
        })

        ft.onComplete(() => logger.info("completed #" + i))
        executor.submit(ft)
    }

    await executor.run()
    const results = executor.collectResults()
    for (const result of results) {
        logger.info("result:" + result)
    }
}

main()
