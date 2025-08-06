import cluster from "node:cluster"
import os from "node:os"
import type { AbstractLogger } from "./Logger.js"
import { Results } from "#src/core/Result.js"

export function RunCluster(
    logger: AbstractLogger,
    entrypoint: () => Promise<void>,
) {
    const numCPUs = os.cpus().length
    if (cluster.isPrimary) {
        logger.info("starting cluster", { masterPID: process.pid })
        for (let i = 0; i < numCPUs; i++) {
            cluster.fork()
        }

        cluster.on("exit", (worker) => {
            logger.info("worker process died", {
                status: "Restarting",
                workerPID: worker.process.pid,
            })
            cluster.fork()
        })
    } else {
        Results.ofPromise(entrypoint()).then((result) => {
            if (!result.isValid) {
                logger.error("server startup failure", { error: result.error })
            }
        })
    }
}
