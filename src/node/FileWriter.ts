import fs from "node:fs/promises"
import fsSync from "node:fs"
import { Results } from "#src/core/Monads.ts"
import { Filesystem, FilesystemError } from "./Filesystem.ts"
import { Type, Types } from "../core/Types.ts"
import { type ReadableStream } from "node:stream/web"
import { Readable } from "node:stream"
import { finished } from "node:stream/promises"

export class FileWriter {
    static async write(path: string, content: string | Buffer | Blob): Promise<void> {
        const exists = await Filesystem.exists(path)
        if (!exists) {
            const createResult = await Results.ofPromise(Filesystem.touch(path))
            if (createResult.isError) {
                throw new FilesystemError("failed to create file", createResult.error)
            }
        } else {
            const isFile = await Results.ofPromise(Filesystem.isFile(path))
            if (isFile.isError) {
                throw new FilesystemError("path is not a valid file", isFile.error)
            }
        }

        const contentType = Types.getType(content)
        if (contentType.isError) {
            throw new FilesystemError("failed to detect content type", contentType.error)
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
                const conversionResult = await Results.ofPromise((content as Blob).arrayBuffer())
                if (conversionResult.isError) {
                    throw new FilesystemError(
                        "failed to convert blob to buffer",
                        conversionResult.error,
                    )
                }

                const bufferResult = Results.of(() => Buffer.from(conversionResult.value))
                if (bufferResult.isError) {
                    throw new FilesystemError("failed to instantiate buffer", bufferResult.error)
                }
                buffer = bufferResult.value
                break

            default:
                throw new FilesystemError("invalid content type provided")
        }

        const writeResult = await Results.ofPromise(fs.writeFile(path, buffer))
        if (writeResult.isError) {
            throw new FilesystemError("failed to write content", writeResult.error)
        }
    }

    /**
     * Write file to disk using web Readable stream.
     * @param {ReadableStream} inputStream - Type imported from "node:stream/web"
     */
    static async writeFromStream(path: string, inputStream: ReadableStream): Promise<void> {
        const writeStream = Results.of(() => fsSync.createWriteStream(path))
        if (writeStream.isError) {
            throw new FilesystemError("failed to create write stream", writeStream.error)
        }

        const outputStream = Results.of(() => Readable.fromWeb(inputStream).pipe(writeStream.value))
        if (outputStream.isError) {
            throw new FilesystemError("failed to create output stream", outputStream.error)
        }

        const finalResult = await Results.ofPromise(finished(outputStream.value))

        if (finalResult.isError) {
            throw new FilesystemError("stream completion failed", finalResult.error)
        }
    }
}
