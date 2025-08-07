import { HttpClient, HttpRequest } from "./core/HttpClient.js"
import { Results, type Result } from "./core/Result.js"
import { File } from "./node/File.js"
import { type ReadableStream } from "node:stream/web"

async function run(): Promise<Result<unknown>> {
    const rawURL =
        "https://cdni.nastypornpics.com/1280/5/98/83232692/83232692_013_ac54.jpg"

    const url = Results.of(() => new URL(rawURL))
    if (!url.isValid) {
        return url
    }

    const req = new HttpRequest(url.value).setTimeout(100_000)
    const client = new HttpClient()

    const res = await client.stream(req)
    if (!res.isValid) {
        return res
    }

    console.log("name :: ", res.value.constructor.name)
    const file = new File("/home/moeenn/Downloads/image.jpg")
    const writeResult = await file.writeFromStream(res.value as ReadableStream)
    console.log(writeResult)

    return Results.nil()
}

async function main() {
    const output = await run()
    if (!output.isValid) {
        console.error("error: " + output.error)
        process.exit(1)
    }
}

main()
