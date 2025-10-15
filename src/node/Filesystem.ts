import fs from "node:fs/promises"
import { Results, type NilResult, type Result } from "#src/core/Monads.js"

async function exists(path: string): Promise<boolean> {
    const output = await Results.ofPromise(fs.access(path, fs.constants.F_OK))
    return !output.isError
}

async function isDirectory(path: string): Promise<Result<boolean>> {
    const output = await Results.ofPromise(fs.lstat(path))
    if (output.isError) {
        return Results.wrap(output, "failed to get details of path")
    }

    const isDir = Results.of(() => output.value.isDirectory())
    if (isDir.isError) {
        return Results.wrap(isDir, "failed to check if path is a directory")
    }

    return Results.ok(isDir.value)
}

async function isFile(path: string): Promise<Result<boolean>> {
    const output = await Results.ofPromise(fs.lstat(path))
    if (output.isError) {
        return Results.wrap(output, "failed to get details of path")
    }

    const isFile = Results.of(() => output.value.isFile())
    if (isFile.isError) {
        return Results.wrap(isFile, "failed to check if path is a file")
    }

    return Results.ok(isFile.value)
}

async function isLink(path: string): Promise<Result<boolean>> {
    const output = await Results.ofPromise(fs.lstat(path))
    if (output.isError) {
        return Results.wrap(output, "failed to get details of path")
    }

    const isLink = Results.of(() => output.value.isSymbolicLink())
    if (isLink.isError) {
        return Results.wrap(
            isLink,
            "failed to check if path is a symbolic link",
        )
    }

    return Results.ok(isLink.value)
}

async function touch(path: string): Promise<NilResult> {
    const handle = await Results.ofPromise(fs.open(path, "w"))
    if (handle.isError) {
        return Results.wrap(handle, "failed to create file")
    }

    const closeResult = await Results.ofPromise(handle.value.close())
    if (!closeResult) {
        return Results.wrap(closeResult, "failed to close create file")
    }

    return Results.nil()
}

async function makeDir(path: string, makeParents = false): Promise<NilResult> {
    const result = await Results.ofPromise(
        fs.mkdir(path, { recursive: makeParents }),
    )
    if (result.isError) {
        return result
    }

    return Results.nil()
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
