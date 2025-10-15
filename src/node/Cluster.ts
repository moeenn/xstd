import cluster from "node:cluster"
import os from "node:os"
import type { AbstractLogger } from "./Logger.js"
import { Results } from "#src/core/Monads.js"

export type ClusterWorkerCount = number | "MAX"

type ClusterArgs = {
    logger?: AbstractLogger
    workerCount: ClusterWorkerCount
}

export class Cluster {
    #logger?: AbstractLogger
    #workerCount: ClusterWorkerCount

    constructor(args: ClusterArgs) {
        this.#logger = args.logger
        this.#workerCount = args.workerCount
    }

    start(entrypoint: () => Promise<void>) {
        const numCPUs = os.cpus().length
        if (cluster.isPrimary) {
            const numWorkers =
                this.#workerCount === "MAX" ? numCPUs : this.#workerCount
            this.#logger?.info("starting cluster", { masterPID: process.pid })
            for (let i = 0; i < numWorkers; i++) {
                cluster.fork()
            }

            cluster.on("exit", (worker) => {
                this.#logger?.info("worker process died", {
                    status: "Restarting",
                    workerPID: worker.process.pid,
                })
                cluster.fork()
            })
        }

        if (!cluster.isPrimary) {
            Results.ofPromise(entrypoint()).then((result) => {
                if (result.isError) {
                    this.#logger?.error("server startup failure", {
                        error: result.error,
                    })
                }
            })
        }
    }
}
