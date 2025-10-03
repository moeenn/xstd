import { HttpClient, HttpRequest } from "./core/HttpClient.js"
import { Results, type NilResult } from "./core/Result.js"

async function run(): Promise<NilResult> {
    const url = new URL("https://jsonplaceholder.typicode.com/todos/1")
    const req = new HttpRequest(url)
        .setMethod("GET")
        .setResponseType("json")
        .setTimeout(20_000)

    const client = new HttpClient()
    const resp = await client.send(req)
    if (!resp.isValid) {
        return Results.wrap(resp, "request failed")
    }

    console.log(resp.value)
    return Results.nil()
}

async function main() {
    const err = await run()
    if (!err.isValid) {
        console.error("error: " + err.error)
    }
}

main()
