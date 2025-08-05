import { TryAsync } from "../core/Try.js"
import { type Result, Results } from "../core/Result.js"

type StatusCallback<T> = (future: Future<T>) => void
type AsyncCallback<T> = () => Promise<T>

export class Future<T> {
    #callback: AsyncCallback<T>
    #onCompleteCallbacks: StatusCallback<T>[]
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

    onComplete(callback: StatusCallback<T>) {
        this.#onCompleteCallbacks.push(callback)
    }

    async run(): Promise<Result<T>> {
        this.state = { status: "inprogress" }
        const result = await TryAsync(this.#callback())
        if (!result.isValid) {
            this.state = { status: "errored", error: result.error }
            return Results.err(result.error)
        }

        this.state = { status: "completed", result: result.value }
        if (this.#onCompleteCallbacks.length) {
            for (const cb of this.#onCompleteCallbacks) {
                cb(this)
            }
        }

        return Results.ok(result.value)
    }
}
