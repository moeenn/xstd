import assert from "node:assert/strict"
import { EventEmitter } from "node:events"
import { type Option, Options } from "../core/Option.js"
import type { Future } from "./Future.js"

export class ExecutorService<T, E> {
    #limit: number
    #futures: Future<T, E>[]
    #emitter: EventEmitter
    #message = {
        done: "done",
    }

    constructor(limit: number) {
        assert(limit > 0, "executor service limit should be greater than zero")
        this.#limit = limit
        this.#futures = []
        this.#emitter = new EventEmitter()
    }

    #getNextFuture(): Option<Future<T, E>> {
        for (const future of this.#futures) {
            if (future.isPending()) {
                return Options.some(future)
            }
        }

        this.#emitter.emit(this.#message.done)
        return Options.none()
    }

    submit(future: Future<T, E>): void {
        future.onComplete(() => {
            const nextFuture = this.#getNextFuture()
            if (nextFuture.isPresent) {
                nextFuture.value.run()
            }
        })

        this.#futures.push(future)
    }

    run(): Promise<void> {
        return new Promise((resolve) => {
            this.#emitter.on(this.#message.done, resolve)

            for (let i = 0; i < this.#limit; i++) {
                this.#futures[i].run()
            }
        })
    }
}
