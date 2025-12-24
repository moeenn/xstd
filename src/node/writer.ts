export interface Writer {
    // eslint-disable-next-line no-unused-vars
    write(data: string): void
}

export class ConsoleWriter implements Writer {
    write(data: string) {
        // eslint-disable-next-line no-console
        console.log(data)
    }
}
