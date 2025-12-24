import { Results } from "./Monads.ts"

export class Time {
    readonly #hours: number
    readonly #minutes: number

    private constructor(hours: number, minutes: number) {
        this.#hours = hours
        this.#minutes = minutes
    }

    static of(hours: number, minutes: number): Time {
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            throw new Error(`invalid time: ${hours}:${minutes}`)
        }
        return new Time(hours, minutes)
    }

    public static from24HourString(input: string): Time {
        const [hours, minutes] = input.split(":")
        if (!hours || !minutes) {
            throw new Error(`invalid time: ${input}`)
        }

        const hoursAsNumber = Results.of(() => parseInt(hours))
        if (hoursAsNumber.isError) {
            throw new Error(`invalid hours value: ${hours}`)
        }

        const minutesAsNumber = Results.of(() => parseInt(minutes))
        if (minutesAsNumber.isError) {
            throw new Error(`invalid minutes value: ${minutes}`)
        }

        return new Time(hoursAsNumber.value, minutesAsNumber.value)
    }

    public static from12HourString(input: string): Time {
        const timeString = input.substring(0, input.length - 2).trim()
        const amPmString = input
            .substring(input.length - 2, input.length)
            .trim()
            .toLowerCase()

        if (!amPmString || !["am", "pm"].includes(amPmString)) {
            throw new Error(`am/pm missing from 12-hour time`)
        }

        const [hours, minutes] = timeString.split(":")
        if (!hours || !minutes) {
            throw new Error(`missing hours or minutes`)
        }

        const hoursAsNumber = Results.of(() => parseInt(hours))
        if (hoursAsNumber.isError) {
            throw new Error(`invalid hours value: ${hours}`)
        }

        const minutesAsNumber = Results.of(() => parseInt(minutes))
        if (minutesAsNumber.isError) {
            throw new Error(`invalid minutes value: ${hours}`)
        }

        const adjustedHours = ((): number => {
            if (amPmString == "am" && hoursAsNumber.value == 12) return 0
            if (amPmString === "pm" && hoursAsNumber.value != 12) return hoursAsNumber.value + 12
            return hoursAsNumber.value
        })()

        return new Time(adjustedHours, minutesAsNumber.value)
    }

    private static zeroPad(n: number): string {
        return String(n).padStart(2, "0")
    }

    public to24HourString(): string {
        return `${Time.zeroPad(this.#hours)}:${Time.zeroPad(this.#minutes)}`
    }

    public to12HourString(): string {
        const adjustedHours = this.#hours == 0 || this.#hours == 12 ? 12 : this.#hours % 12
        const amPm = this.#hours < 12 ? "AM" : "PM"
        return `${Time.zeroPad(adjustedHours)}:${Time.zeroPad(this.#minutes)}${amPm}`
    }
}
