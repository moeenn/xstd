import { styleText } from "node:util"
import process from "node:process"
import { StringBuilder } from "#src/core/StringBuilder.ts"

type Stringable = {
    toString(): string
}

function buildString(message: string, ...args: Stringable[]): string {
    const builder = new StringBuilder()
    builder.append(message)
    for (const arg of args) {
        builder.append(" " + arg.toString())
    }

    return builder.toString()
}

function print(message: string, ...args: Stringable[]): void {
    const s = buildString(message, args)
    process.stdout.write(s + "\n")
}

type Color = "red" | "yellow" | "green" | "blue"

function createFn(color: Color) {
    return (message: string, ...args: Stringable[]): void => {
        const s = buildString(message, args)
        process.stdout.write(styleText(color, s + "\n"))
    }
}

export const fmt = {
    print,
    info: createFn("blue"),
    success: createFn("green"),
    warn: createFn("yellow"),
    error: createFn("red"),
} as const
