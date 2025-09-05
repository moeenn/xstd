import { styleText } from "node:util"
import process from "node:process"
import type { Stringable } from "./Print.js"
import { StringBuilder } from "#src/core/StringBuilder.js"

function print(message: string, ...args: Stringable[]): void {
    const builder = new StringBuilder()
    builder.append(message)
    for (const arg of args) {
        builder.append(" " + arg.toString())
    }

    process.stdout.write(builder.toString() + "\n")
}

function warn(message: string, ...args: Stringable[]): void {
    const builder = new StringBuilder()
    builder.append(message)
    for (const arg of args) {
        builder.append(" " + arg.toString())
    }

    process.stdout.write(styleText("yellow", builder.toString()) + "\n")
}

function error(message: string, ...args: Stringable[]): void {
    const builder = new StringBuilder()
    builder.append(message)
    for (const arg of args) {
        builder.append(" " + arg.toString())
    }

    process.stderr.write(styleText("red", builder.toString()) + "\n")
}

export const fmt = {
    print,
    warn,
    error,
} as const
