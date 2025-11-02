import fs from "node:fs/promises"
import { Results, type Option } from "#src/core/Monads.js"

export class FilesystemError extends Error {
    details: Option<string> = null

    constructor(message: string, details: Option<Error> = null) {
        super(message)
        this.details = details?.message ?? null
    }
}

async function exists(path: string): Promise<boolean> {
    const output = await Results.ofPromise(fs.access(path, fs.constants.F_OK))
    return !output.isError
}

async function isDirectory(path: string): Promise<boolean> {
    const output = await Results.ofPromise(fs.lstat(path))
    if (output.isError) {
        throw new FilesystemError("failed to get details of path", output.error)
    }

    const isDir = Results.of(() => output.value.isDirectory())
    if (isDir.isError) {
        throw new FilesystemError(
            "failed to check if path is a directory",
            isDir.error,
        )
    }

    return isDir.value
}

async function isFile(path: string): Promise<boolean> {
    const output = await Results.ofPromise(fs.lstat(path))
    if (output.isError) {
        throw new FilesystemError("failed to get details of path", output.error)
    }

    const isFile = Results.of(() => output.value.isFile())
    if (isFile.isError) {
        throw new FilesystemError(
            "failed to check if path is a file",
            isFile.error,
        )
    }

    return isFile.value
}

async function isLink(path: string): Promise<boolean> {
    const output = await Results.ofPromise(fs.lstat(path))
    if (output.isError) {
        throw new FilesystemError("failed to get details of path", output.error)
    }

    const isLink = Results.of(() => output.value.isSymbolicLink())
    if (isLink.isError) {
        throw new FilesystemError(
            "failed to check if path is a symbolic link",
            isLink.error,
        )
    }

    return isLink.value
}

async function touch(path: string): Promise<void> {
    const handle = await Results.ofPromise(fs.open(path, "w"))
    if (handle.isError) {
        throw new FilesystemError("failed to create file", handle.error)
    }

    const closeResult = await Results.ofPromise(handle.value.close())
    if (!closeResult) {
        throw new FilesystemError("failed to close create file", closeResult)
    }
}

async function makeDir(path: string, makeParents = false): Promise<void> {
    const result = await Results.ofPromise(
        fs.mkdir(path, { recursive: makeParents }),
    )
    if (result.isError) {
        throw new FilesystemError("failed to create directory", result.error)
    }
}

export const Filesystem = {
    exists,
    isFile,
    isDirectory,
    isLink,
    touch,
    makeDir,
    // TODO: makeLink
    // TODO: removeFile
    // TODO: removeDir
} as const
