import fs from "node:fs/promises"
import fsSync from "node:fs"
import { Results, type NilResult } from "#src/core/Monads.js"
import { Filesystem } from "./Filesystem.js"
import { Type, Types } from "../core/Types.js"
import { type ReadableStream } from "node:stream/web"
import { Readable } from "node:stream"
import { finished } from "node:stream/promises"

export class FileWriter {
    static async write(
        path: string,
        content: string | Buffer | Blob,
    ): Promise<NilResult> {
        const exists = await Filesystem.exists(path)
        if (!exists) {
            const createResult = await Filesystem.touch(path)
            if (createResult.isError) {
                return Results.wrap(createResult, "failed to create file")
            }
        } else {
            const isFile = await Filesystem.isFile(path)
            if (isFile.isError) {
                return Results.wrap(isFile, "path is not a valid file")
            }
        }

        const contentType = Types.getType(content)
        if (contentType.isError) {
            return Results.wrap(contentType, "failed to detect content type")
        }

        let buffer: Buffer
        switch (contentType.value) {
            case Type.String:
                buffer = Buffer.from(content as string)
                break

            case Type.Buffer:
                buffer = content as Buffer
                break

            case Type.Blob:
                const conversionResult = await Results.ofPromise(
                    (content as Blob).arrayBuffer(),
                )
                if (conversionResult.isError) {
                    return Results.wrap(
                        conversionResult,
                        "failed to convert blob to buffer",
                    )
                }

                const bufferResult = Results.of(() =>
                    Buffer.from(conversionResult.value),
                )
                if (bufferResult.isError) {
                    return Results.wrap(
                        bufferResult,
                        "failed to instantiate buffer",
                    )
                }
                buffer = bufferResult.value
                break

            default:
                return Results.err("invalid content type provided")
        }

        const writeResult = await Results.ofPromise(fs.writeFile(path, buffer))
        if (writeResult.isError) {
            return Results.wrap(writeResult, "failed to write content")
        }

        return Results.nil()
    }

    /**
     * Write file to disk using web Readable stream.
     * @param {ReadableStream} inputStream - Type imported from "node:stream/web"
     */
    static async writeFromStream(
        path: string,
        inputStream: ReadableStream,
    ): Promise<NilResult> {
        const writeStream = Results.of(() => fsSync.createWriteStream(path))
        if (writeStream.isError) {
            return Results.wrap(writeStream, "failed to create write stream")
        }

        const outputStream = Results.of(() =>
            Readable.fromWeb(inputStream).pipe(writeStream.value),
        )
        if (outputStream.isError) {
            return Results.wrap(outputStream, "failed to create output stream")
        }

        const finalResult = await Results.ofPromise(
            finished(outputStream.value),
        )

        if (finalResult.isError) {
            return Results.wrap(finalResult, "stream completion failed")
        }

        return Results.nil()
    }
}
