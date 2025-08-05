import { TryAsync } from "../core/Try.js"
import { type Result, Results } from "../core/Result.js"
import { type Option, Options } from "#src/core/Option.js"

type Thunk = () => void
type AsyncCallback<T, E> = (args: T) => Promise<E>

export class Future<T, E> {
    #args: T
    #callback: AsyncCallback<T, E>
    #onCompleteCallback: Option<Thunk>
    #state:
        | { readonly status: "pending" }
        | { readonly status: "completed"; result: E }
        | { readonly status: "errored"; error: string }

    constructor(args: T, callback: AsyncCallback<T, E>) {
        this.#callback = callback
        this.#args = args
        this.#onCompleteCallback = Options.none()
        this.#state = { status: "pending" }
        return this
    }

    onComplete(callback: Thunk) {
        this.#onCompleteCallback = Options.some(callback)
    }

    async run(): Promise<Result<E>> {
        const result = await TryAsync(this.#callback(this.#args))
        if (!result.isValid) {
            this.#state = { status: "errored", error: result.error }
            return Results.err(result.error)
        }

        this.#state = { status: "completed", result: result.value }
        if (this.#onCompleteCallback.isPresent) {
            this.#onCompleteCallback.value()
        }

        return Results.ok(result.value)
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
