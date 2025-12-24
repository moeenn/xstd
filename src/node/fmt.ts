import { styleText } from "node:util"
import process from "node:process"
import { StringBuilder } from "#src/core/stringBuilder.ts"

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

type Color = "red" | "yellow" | "green" | "blue"

function createFn(color: Color) {
    return (message: string, ...args: Stringable[]): void => {
        const s = buildString(message, args)
        process.stdout.write(styleText(color, s + "\n"))
    }
}

export class Fmt {
    static print(message: string, ...args: Stringable[]): void {
        const s = buildString(message, args)
        process.stdout.write(s + "\n")
    }

    static info = createFn("blue")
    static success = createFn("green")
    static warn = createFn("yellow")
    static error = createFn("red")
}
