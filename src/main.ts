import { HttpClient, HttpRequest, HttpResponseType } from "./core/HttpClient.js"
import { Results, type Result } from "./core/Result.js"
import { Type, Types } from "./core/Types.js"
import { Filesystem } from "./node/Filesystem.js"
import { fmt } from "./node/Fmt.js"
import type { Stringable } from "./node/Print.js"
import { File } from "./node/File.js"

import fs from "node:fs/promises"

import { type ReadableStream } from "node:stream/web"
import { Readable } from "node:stream"
import { finished } from "node:stream/promises"

async function run(): Promise<Result<unknown>> {
    const rawURL =
        "https://cdni.nastypornpics.com/1280/1/116/65611346/65611346_008_6507.jpg"

    const url = Results.of(() => new URL(rawURL))
    if (!url.isValid) {
        return url
    }

    const req = new HttpRequest(url.value).setTimeout(100_000)

    const client = new HttpClient()

    /*
    const res = await client.send(req, HttpResponseType.Stream)
    if (!res.isValid) {
        return res
    }

    console.log("name :: ", res.value.constructor.name)
    const path = "/home/moeenn/Downloads/image.jpg"
    const writeStream = fs.createWriteStream(path)
    await finished(
        Readable.fromWeb(res.value as ReadableStream).pipe(writeStream),
    )
    */

    const res = await client.send(req, HttpResponseType.Blob)
    if (!res.isValid) {
        return res
    }

    const path = "/home/moeenn/Downloads/image.jpg"
    const outputFile = new File(path)

    const writeResult = await outputFile.write(res.value as Blob)
    console.log(writeResult)

    //const buffer = Buffer.from(await (res.value as Blob).arrayBuffer())
    // await fs.writeFile(path, buffer)

    return Results.ok(null)
}

async function main() {
    const output = await run()
    if (!output.isValid) {
        console.error("error: " + output.error)
        process.exit(1)
    }
}

main()
