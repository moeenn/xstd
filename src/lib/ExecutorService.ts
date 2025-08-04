import assert from "node:assert/strict"
import { EventEmitter } from "node:events"
import { TryAsync } from "./Try.js"
import { err, ok, type Result } from "./Result.js"
import { none, some, type Optional } from "./Optional.js"

type Thunk = () => void
type AsyncCallback<T, E> = (args: T) => Promise<E>

class Future<T, E> {
    #args: T
    #callback: AsyncCallback<T, E>
    #onCompleteCallback: Optional<Thunk>
    #state:
        | { readonly status: "pending" }
        | { readonly status: "completed"; result: E }
        | { readonly status: "errored"; error: string }

    constructor(args: T, callback: AsyncCallback<T, E>) {
        this.#callback = callback
        this.#args = args
        this.#onCompleteCallback = none()
        this.#state = { status: "pending" }
        return this
    }

    addOnCompleteCallback(callback: Thunk) {
        this.#onCompleteCallback = some(callback)
    }

    async run(): Promise<Result<E>> {
        const result = await TryAsync(this.#callback(this.#args))
        if (!result.valid) {
            this.#state = { status: "errored", error: result.error }
            return err(result.error)
        }

        this.#state = { status: "completed", result: result.value }
        if (this.#onCompleteCallback.isPresent) {
            this.#onCompleteCallback.value()
        }

        return ok(result.value)
    }

    isPending(): boolean {
        return this.#state.status === "pending"
    }

    isCompleted(): boolean {
        return this.#state.status === "completed"
    }

    isErrored(): boolean {
        return this.#state.status === "errored"
    }
}

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

    getNextFuture(): Optional<Future<T, E>> {
        for (const future of this.#futures) {
            if (future.isPending()) {
                return some(future)
            }
        }

        this.#emitter.emit(this.#message.done)
        return none()
    }

    submit(future: Future<T, E>): void {
        future.addOnCompleteCallback(() => {
            const nextFuture = this.getNextFuture()
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
