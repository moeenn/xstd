import process from "node:process"

export interface Stringable {
    toString(): string
}

export function sprintf(
    message: string,
    args: Record<string, Stringable> | Stringable[],
): string {
    let output = `${message}`

    if (Array.isArray(args)) {
        for (const [i, arg] of args.entries()) {
            output = output.replaceAll("{" + i + "}", arg.toString())
        }
        return output
    }

    for (const [key, value] of Object.entries(args)) {
        output = output.replaceAll("{" + key + "}", value.toString())
    }

    return output
}

export function printf(
    message: string,
    args: Record<string, Stringable> | Stringable[],
): void {
    const buffer = sprintf(message, args)
    process.stdout.write(buffer)
}
