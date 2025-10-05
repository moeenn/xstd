type Option<T> = T | null | undefined

class Node<T> {
    data: T
    next: Option<Node<T>>

    constructor(data: T) {
        this.data = data
        this.next = null
    }
}

export class LinkedList<T> {
    #head: Option<Node<T>> = null
    #size = 0

    append(data: T) {
        const newNode = new Node(data)
        if (this.#head == null) {
            this.#head = newNode
            this.#size++
            return
        }

        let current = this.#head
        for (; current.next != null; current = current.next) {}

        current.next = newNode
        this.#size++
    }

    *[Symbol.iterator]() {
        let current = this.#head
        while (current != null) {
            yield current.data
            current = current.next
        }
    }

    // TODO: complete implementation.
}
