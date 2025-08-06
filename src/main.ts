// import { setTimeout } from "node:timers/promises"
// import { ExecutorService } from "./node/ExecutorService.js"
// import { Future } from "./node/Future.js"

import { JsonLogger, LogLevel } from "./node/Logger.js"
import { ConsoleWriter } from "./node/Writer.js"

// function getRandomInt(max: number): number {
//     return Math.floor(Math.random() * max)
// }

// async function main() {
//     const executor = new ExecutorService<string>(3)
//     for (let i = 0; i < 10; i++) {
//         const ft = new Future(async (): Promise<string> => {
//             console.log("running #" + i)
//             await setTimeout(getRandomInt(4_000))
//             return `Result # ${i}`
//         })

//         ft.onComplete((future) => console.log("completed #" + i))
//         executor.submit(ft)
//     }

//     await executor.run()
//     const results = executor.collectResults()
//     for (const result of results) {
//         console.log(result)
//     }
// }

function main() {
    const logger = new JsonLogger(ConsoleWriter, LogLevel.Info)
    logger.info("this is an info message", { port: "4000" })
    logger.warn("this is an info message", { port: "4000" })
    logger.error("this is an info message", { port: "4000" })
}

main()
