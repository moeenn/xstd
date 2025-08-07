import fs from "node:fs/promises"
import { Results, type Result } from "#src/core/Result.js"
import { File } from "./File.js"

async function exists(path: string): Promise<boolean> {
    const output = await Results.ofPromise(fs.access(path, fs.constants.F_OK))
    return output.isValid
}

async function isDirectory(path: string): Promise<Result<boolean>> {
    const output = await Results.ofPromise(fs.lstat(path))
    if (!output.isValid) {
        return Results.wrap(
            output,
            (err) => "failed to get details of path: " + err,
        )
    }

    const isDir = Results.of(() => output.value.isDirectory())
    if (!isDir.isValid) {
        return Results.wrap(
            isDir,
            (err) => "failed to check if path is a directory: " + err,
        )
    }

    return Results.ok(isDir.value)
}

async function isFile(path: string): Promise<Result<boolean>> {
    const output = await Results.ofPromise(fs.lstat(path))
    if (!output.isValid) {
        return Results.wrap(
            output,
            (err) => "failed to get details of path: " + err,
        )
    }

    const isFile = Results.of(() => output.value.isFile())
    if (!isFile.isValid) {
        return Results.wrap(
            isFile,
            (err) => "failed to check if path is a file: " + err,
        )
    }

    return Results.ok(isFile.value)
}

async function isLink(path: string): Promise<Result<boolean>> {
    const output = await Results.ofPromise(fs.lstat(path))
    if (!output.isValid) {
        return Results.wrap(
            output,
            (err) => "failed to get details of path: " + err,
        )
    }

    const isLink = Results.of(() => output.value.isSymbolicLink())
    if (!isLink.isValid) {
        return Results.wrap(
            isLink,
            (err) => "failed to check if path is a symbolic link: " + err,
        )
    }

    return Results.ok(isLink.value)
}

async function touch(path: string): Promise<Result<null>> {
    const handle = await Results.ofPromise(fs.open(path, "w"))
    if (!handle.isValid) {
        return Results.wrap(handle, (err) => "failed to create file: " + err)
    }

    const closeResult = await Results.ofPromise(handle.value.close())
    if (!closeResult) {
        return Results.wrap(
            closeResult,
            (err) => "failed to close create file: " + err,
        )
    }

    return Results.ok(null)
}

export const Filesystem = {
    exists,
    isFile,
    isDirectory,
    isLink,
    touch,
    // TODO: makeDir (with -p)
    // TODO: makeLink
    // TODO: removeFile
    // TODO: removeDir
} as const
