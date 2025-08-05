import assert from "node:assert/strict"
import { EventEmitter } from "node:events"
import { type Option, Options } from "../core/Option.js"
import type { Future } from "./Future.js"
import { setTimeout } from "node:timers/promises"

export class ExecutorService<T> {
    #limit: number
    #futures: Future<T>[]
    #emitter: EventEmitter
    #pollDelay: number = 1_000
    #message = {
        done: "done",
    }

    constructor(limit: number) {
        assert(limit > 0, "executor service limit should be greater than zero")
        this.#limit = limit
        this.#futures = []
        this.#emitter = new EventEmitter()
    }

    setPollDelay(delay: number) {
        assert(delay > 0)
        this.#pollDelay = delay
    }

    #getNextFuture(): Option<Future<T>> {
        for (const future of this.#futures) {
            if (future.state.status === "pending") {
                return Options.some(future)
            }
        }

        this.#pollCompleteStatus()
        return Options.none()
    }

    async #pollCompleteStatus() {
        const numInProgress = this.#futures.filter(
            (ft) => ft.state.status === "inprogress",
        ).length

        /**
         *  keep rechecking futures status recursively untill all no more
         * futures are in progress
         */
        if (numInProgress === 0) {
            this.#emitter.emit(this.#message.done)
            return
        }

        await setTimeout(this.#pollDelay)
        await this.#pollCompleteStatus()
    }

    submit(future: Future<T>): void {
        future.onComplete(() => {
            const nextFuture = this.#getNextFuture()
            if (nextFuture.isPresent) {
                nextFuture.value.run()
            }
        })

        this.#futures.push(future)
    }

    collectResults(): T[] {
        const completedResults = []
        for (const future of this.#futures) {
            if (future.state.status === "completed") {
                completedResults.push(future.state.result)
            }
        }
        return completedResults
    }

    run(): Promise<void> {
        return new Promise((resolve) => {
            this.#emitter.on(this.#message.done, resolve)

            const upperLimit = Math.min(this.#futures.length, this.#limit)
            for (let i = 0; i < upperLimit; i++) {
                this.#futures[i].run()
            }
        })
    }
}
