export interface Writer {
    // eslint-disable-next-line no-unused-vars
    write(data: string): void
}

export const ConsoleWriter: Writer = {
    write(data: string) {
        // eslint-disable-next-line no-console
        console.log(data)
    },
} as const

// TODO: implement file writer class.
