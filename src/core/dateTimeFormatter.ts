import { datePlaceholders, type DatePlaceholder } from "./datePlaceholder.ts"
import { type Option } from "./monads.ts"

export const Format = {
    full: "%Y-%m-%d %H:%M",
    dateOnly: "%Y-%m-%d",
    TwentyfourHourTime: "%H:%M",
    TwelvehourTime: "%I:%M %p",
} as const

type DateFormat = keyof typeof Format | string

export class DateTimeFormatter {
    static extractPlaceholders(format: string): Set<string> {
        const pattern = /%[a-zA-Z]/g
        const matches = format.match(pattern)
        if (!matches) {
            return new Set()
        }
        return new Set(matches)
    }

    static findPlaceholder(placeholder: string): Option<DatePlaceholder> {
        for (const p of datePlaceholders) {
            if (p.placeholders.includes(placeholder)) {
                return p
            }
        }

        return null
    }

    static format(date: Date, format: DateFormat): string {
        const placeholdersSet = DateTimeFormatter.extractPlaceholders(format)
        if (placeholdersSet.size === 0) {
            throw new Error("no placeholders found in format string")
        }

        // create a copy so input format string is not mutated.
        let output = `${format}`
        for (const placeholder of placeholdersSet) {
            const foundDatePlaceholder = DateTimeFormatter.findPlaceholder(placeholder)

            if (!foundDatePlaceholder) {
                throw new Error(`unknown placeholder: ${placeholder}`)
            }

            const value = foundDatePlaceholder.format(date)
            output = output.replaceAll(placeholder, value)
        }

        return output
    }
}
