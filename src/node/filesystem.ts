import fs from "node:fs/promises"
import { Result, type option } from "#src/core/monads.ts"

export class FilesystemError extends Error {
    details: option<string>

    constructor(message: string, details: option<Error> = undefined) {
        super(message)
        this.details = details?.message
    }
}

export class Filesystem {
    static async exists(path: string): Promise<boolean> {
        const output = await Result.ofPromise(fs.access(path, fs.constants.F_OK))
        return !output.isError
    }

    static async isDirectory(path: string): Promise<boolean> {
        const output = await Result.ofPromise(fs.lstat(path))
        if (output.isError) {
            throw new FilesystemError("failed to get details of path", output.error)
        }

        const isDir = Result.of(() => output.value.isDirectory())
        if (isDir.isError) {
            throw new FilesystemError("failed to check if path is a directory", isDir.error)
        }

        return isDir.value
    }

    static async isFile(path: string): Promise<boolean> {
        const output = await Result.ofPromise(fs.lstat(path))
        if (output.isError) {
            throw new FilesystemError("failed to get details of path", output.error)
        }

        const isFile = Result.of(() => output.value.isFile())
        if (isFile.isError) {
            throw new FilesystemError("failed to check if path is a file", isFile.error)
        }

        return isFile.value
    }

    static async isLink(path: string): Promise<boolean> {
        const output = await Result.ofPromise(fs.lstat(path))
        if (output.isError) {
            throw new FilesystemError("failed to get details of path", output.error)
        }

        const isLink = Result.of(() => output.value.isSymbolicLink())
        if (isLink.isError) {
            throw new FilesystemError("failed to check if path is a symbolic link", isLink.error)
        }

        return isLink.value
    }

    static async touch(path: string): Promise<void> {
        const handle = await Result.ofPromise(fs.open(path, "w"))
        if (handle.isError) {
            throw new FilesystemError("failed to create file", handle.error)
        }

        const closeResult = await Result.ofPromise(handle.value.close())
        if (!closeResult) {
            throw new FilesystemError("failed to close create file", closeResult)
        }
    }

    static async makeDir(path: string, makeParents = false): Promise<void> {
        const result = await Result.ofPromise(fs.mkdir(path, { recursive: makeParents }))
        if (result.isError) {
            throw new FilesystemError("failed to create directory", result.error)
        }
    }

    // TODO: makeLink
    // TODO: removeFile
    // TODO: removeDir
}
