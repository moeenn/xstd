import assert from "node:assert/strict"
import { EventEmitter } from "node:events"
import { Results, type Result, type Option } from "#src/core/Monads.js"

type StatusCallback = () => void
type AsyncCallback<T> = () => Promise<T>

class Future<T> {
    #callback: AsyncCallback<T>
    #onCompleteCallbacks: StatusCallback[]
    state:
        | { readonly status: "pending" }
        | { readonly status: "inprogress" }
        | { readonly status: "completed"; result: T }
        | { readonly status: "errored"; error: string }

    constructor(callback: AsyncCallback<T>) {
        this.#callback = callback
        this.#onCompleteCallbacks = []
        this.state = { status: "pending" }
        return this
    }

    onComplete(callback: StatusCallback) {
        this.#onCompleteCallbacks.push(callback)
    }

    async run(): Promise<Result<T>> {
        this.state = { status: "inprogress" }
        const result = await Results.ofPromise(this.#callback())
        if (result.isError) {
            this.state = { status: "errored", error: result.error.message }
            return Results.err(result.error)
        }

        this.state = { status: "completed", result: result.value }
        if (this.#onCompleteCallbacks.length) {
            for (const cb of this.#onCompleteCallbacks) {
                cb()
            }
        }

        return Results.ok(result.value)
    }
}

export class ExecutorService<T> {
    #limit: number
    #futures: Future<T>[]
    #emitter: EventEmitter
    #message = {
        done: "done",
    }

    constructor(limit: number = 1) {
        assert(
            limit > 0,
            "executor service limit should be greater than or equal to 1",
        )
        this.#limit = limit
        this.#futures = []
        this.#emitter = new EventEmitter()
    }

    #getNextFuture(): Option<Future<T>> {
        for (const future of this.#futures) {
            if (future.state.status === "pending") {
                return future
            }
        }

        this.#checkDoneStatus()
        return null
    }

    async #checkDoneStatus() {
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

        // TODO: remove after testing.
        // await setTimeout(this.#pollDelay)
        // await this.#pollCompleteStatus()
    }

    submit(callback: AsyncCallback<T>): void {
        const future = new Future(callback)
        future.onComplete(() => {
            const nextFuture = this.#getNextFuture()
            if (nextFuture) {
                nextFuture.run()
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
