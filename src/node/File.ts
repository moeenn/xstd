import fs from "node:fs/promises"
import fsSync from "node:fs"
import { Results, type NilResult, type Result } from "#src/core/Result.js"
import { Filesystem } from "./Filesystem.js"
import { Type, Types } from "../core/Types.js"
import { type ReadableStream } from "node:stream/web"
import { Readable } from "node:stream"
import { finished } from "node:stream/promises"

export class File {
    #path: string
    #pathChecked: boolean

    constructor(path: string) {
        this.#path = path
        this.#pathChecked = false
    }

    static async open(path: string): Promise<Result<File>> {
        const fileExists = await Filesystem.exists(path)
        if (!fileExists) {
            return Results.err(`file does not exist: ${path}`)
        }

        const isFile = await Filesystem.isFile(path)
        if (!isFile.isValid) {
            return isFile
        }

        const file = new File(path)
        file.#pathChecked = true

        return Results.ok(file)
    }

    async write(content: string | Buffer | Blob): Promise<NilResult> {
        if (!this.#pathChecked) {
            const exists = await Filesystem.exists(this.#path)
            if (!exists) {
                const createResult = await Filesystem.touch(this.#path)
                if (!createResult.isValid) {
                    return Results.wrap(
                        createResult,
                        (err) => "failed to create file: " + err,
                    )
                }
            } else {
                const isFile = await Filesystem.isFile(this.#path)
                if (!isFile.isValid) {
                    return isFile
                }
            }

            this.#pathChecked = true
        }

        const contentType = Types.getType(content)
        if (!contentType.isValid) {
            return Results.wrap(
                contentType,
                (err) => "failed to detect content type: " + err,
            )
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
                if (!conversionResult.isValid) {
                    return Results.wrap(
                        conversionResult,
                        (err) => "failed to convert blob to buffer: " + err,
                    )
                }

                const bufferResult = Results.of(() =>
                    Buffer.from(conversionResult.value),
                )
                if (!bufferResult.isValid) {
                    return Results.wrap(
                        bufferResult,
                        (err) => "failed to instantiate buffer: " + err,
                    )
                }
                buffer = bufferResult.value
                break

            default:
                return Results.err("invalid content type provided")
        }

        const writeResult = await Results.ofPromise(
            fs.writeFile(this.#path, buffer),
        )

        if (!writeResult.isValid) {
            return Results.wrap(
                writeResult,
                (err) => "failed to write content: " + err,
            )
        }

        return Results.nil()
    }

    /**
     * Write file to disk using web Readable stream.
     *
     * @param {ReadableStream} inputStream - Type imported from "node:stream/web"
     */
    async writeFromStream(inputStream: ReadableStream): Promise<NilResult> {
        const writeStream = Results.of(() =>
            fsSync.createWriteStream(this.#path),
        )
        if (!writeStream.isValid) {
            return Results.wrap(
                writeStream,
                (err) => "failed to create write stream: " + err,
            )
        }

        const outputStream = Results.of(() =>
            Readable.fromWeb(inputStream).pipe(writeStream.value),
        )
        if (!outputStream.isValid) {
            return Results.wrap(
                outputStream,
                (err) => "failed to create output stream: " + err,
            )
        }

        const finalResult = await Results.ofPromise(
            finished(outputStream.value),
        )
        if (!finalResult.isValid) {
            return Results.wrap(
                finalResult,
                (err) => "stream completion failed: " + err,
            )
        }

        return Results.nil()
    }
}
