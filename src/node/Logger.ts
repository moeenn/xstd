import { DateTimeFormatter, Format } from "#src/core/DateTimeFormatter.js"
import type { Either } from "#src/core/Either.js"
import { Options } from "#src/core/Option.js"
import { Results, type Result } from "#src/core/Result.js"
import { StringBuilder } from "#src/core/StringBuilder.js"
import { Env } from "./Env.js"
import type { Writer } from "./Writer.js"

export class LogLevel {
    readonly level: number
    readonly value: string

    static #info = new LogLevel(0, "INFO")
    static #warn = new LogLevel(1, "WARN")
    static #error = new LogLevel(2, "ERROR")

    static fromEnv(key: string = "LOG_LEVEL", env?: Env): Result<LogLevel> {
        const levels = [LogLevel.#info, LogLevel.Warn, LogLevel.Error]
        if (!env) {
            env = new Env()
        }

        const envValue = env.readString(key)
        if (!envValue.isValid) {
            return envValue
        }

        const foundLevel = Options.of(
            levels.find((level) => level.value === envValue.value),
        )
        if (!foundLevel.isPresent) {
            return Results.err(
                `unknown value for environment variable ${key}: ${envValue.value}`,
            )
        }

        return Options.toResult(foundLevel)
    }

    static get Info() {
        return LogLevel.#info
    }

    static get Warn() {
        return LogLevel.#warn
    }

    static get Error() {
        return LogLevel.#error
    }

    private constructor(level: number, value: string) {
        this.level = level
        this.value = value
    }

    toJSON(): string {
        return this.value
    }

    toString(): string {
        return this.value
    }
}

type LoggerOutput = Either<"text", "json">
type LogEntry = {
    timestamp: string
    level: string
    message: string
    details?: Record<string, unknown>
}

export class Logger {
    #writer: Writer
    #currentLevel: LogLevel
    #output: LoggerOutput

    constructor(writer: Writer, level: LogLevel, output: LoggerOutput) {
        this.#writer = writer
        this.#currentLevel = level
        this.#output = output
    }

    #logJson(logEntry: LogEntry): void {
        const encoded = Results.of(() => JSON.stringify(logEntry))
        if (!encoded.isValid) {
            this.error("failed to json encode log entry", {
                error: encoded.error,
            })
            return
        }
        this.#writer.write(encoded.value)
    }

    #logText(logEntry: LogEntry): void {
        const builder = new StringBuilder()
        builder.append(
            `${logEntry.timestamp} - ${logEntry.level} - ${logEntry.message}`,
        )

        if (logEntry.details) {
            for (const [key, value] of Object.entries(logEntry.details)) {
                builder.append(`, ${key}: '${value}'`)
            }
        }

        this.#writer.write(builder.toString())
    }

    #log(targetLevel: LogLevel) {
        return (message: string, details?: Record<string, unknown>): void => {
            if (targetLevel.level >= this.#currentLevel.level) {
                const timestamp = DateTimeFormatter.format(
                    new Date(),
                    Format.full,
                )

                if (!timestamp.isValid) {
                    this.error("failed to get timestamp", {
                        error: timestamp.error,
                    })
                    return
                }

                const logEntry: LogEntry = {
                    timestamp: timestamp.value,
                    level: targetLevel.value,
                    message,
                    details,
                }

                switch (this.#output) {
                    case "text":
                        return this.#logText(logEntry)

                    case "json":
                        return this.#logJson(logEntry)
                }
            }
        }
    }

    info = this.#log(LogLevel.Info)
    warn = this.#log(LogLevel.Warn)
    error = this.#log(LogLevel.Error)
}
