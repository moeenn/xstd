export interface Writer {
    write(data: string): void
}

export class ConsoleWriter implements Writer {
    write(data: string) {
        process.stdout.write(data + "\n")
    }
}

// TODO: implement file writer class.
