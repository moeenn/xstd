export class StringBuilder {
    #pieces: string[] = []

    append(piece: string): void {
        this.#pieces.push(piece)
    }

    toString(): string {
        return this.#pieces.join("")
    }

    toJSON() {
        return this.toString()
    }
}
