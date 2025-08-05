import { Results, type Result } from "./Result.js"
import { Try } from "./Try.js"

export class Time {
    readonly #hours: number
    readonly #minutes: number

    private constructor(hours: number, minutes: number) {
        this.#hours = hours
        this.#minutes = minutes
    }

    of(hours: number, minutes: number): Result<Time> {
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            return Results.err(`invalid time: ${hours}:${minutes}`)
        }
        return Results.ok(new Time(hours, minutes))
    }

    public static from24HourString(input: string): Result<Time> {
        const [hours, minutes] = input.split(":")
        if (!hours || !minutes) {
            return Results.err(`invalid time: ${input}`)
        }

        const hoursAsNumber = Try(() => parseInt(hours))
        if (!hoursAsNumber.isValid) {
            return Results.err(`invalid hours value: ${hours}`)
        }

        const minutesAsNumber = Try(() => parseInt(minutes))
        if (!minutesAsNumber.isValid) {
            return Results.err(`invalid minutes value: ${minutes}`)
        }

        return Results.ok(new Time(hoursAsNumber.value, minutesAsNumber.value))
    }

    public static from12HourString(input: string): Result<Time> {
        const timeString = input.substring(0, input.length - 2).trim()
        const amPmString = input
            .substring(input.length - 2, input.length)
            .trim()
            .toLowerCase()

        if (!amPmString || !["am", "pm"].includes(amPmString)) {
            return Results.err(`am/pm missing from 12-hour time`)
        }

        const [hours, minutes] = timeString.split(":")
        if (!hours || !minutes) {
            return Results.err(`missing hours or minutes`)
        }

        const hoursAsNumber = Try(() => parseInt(hours))
        if (!hoursAsNumber.isValid) {
            return Results.err(`invalid hours value: ${hours}`)
        }

        const minutesAsNumber = Try(() => parseInt(minutes))
        if (!minutesAsNumber.isValid) {
            return Results.err(`invalid minutes value: ${hours}`)
        }

        const adjustedHours = ((): number => {
            if (amPmString == "am" && hoursAsNumber.value == 12) return 0
            if (amPmString === "pm" && hoursAsNumber.value != 12)
                return hoursAsNumber.value + 12
            return hoursAsNumber.value
        })()

        return Results.ok(new Time(adjustedHours, minutesAsNumber.value))
    }

    private static zeroPad(n: number): string {
        return String(n).padStart(2, "0")
    }

    public to24SHourString(): string {
        return `${Time.zeroPad(this.#hours)}:${Time.zeroPad(this.#minutes)}`
    }

    public to12HourString(): string {
        const adjustedHours =
            this.#hours == 0 || this.#hours == 12 ? 12 : this.#hours % 12
        const amPm = this.#hours < 12 ? "AM" : "PM"
        return `${Time.zeroPad(adjustedHours)}:${Time.zeroPad(this.#minutes)}${amPm}`
    }
}
