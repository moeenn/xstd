import { DateTimeFormatter, Format } from "#src/core/DateTimeFormatter.js"
import { Options } from "#src/core/Option.js"
import { Results, type Result } from "#src/core/Result.js"
import { StringBuilder } from "#src/core/StringBuilder.js"
import { Env } from "./Env.js"
import { ConsoleWriter, type Writer } from "./Writer.js"

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

type LogEntry = {
    timestamp: string
    level: string
    message: string
    details?: Record<string, unknown>
}

abstract class AbstractLogger {
    protected writer: Writer
    protected currentLevel: LogLevel

    constructor(writer: Writer, level: LogLevel) {
        this.writer = writer
        this.currentLevel = level
    }

    // eslint-disable-next-line no-unused-vars
    abstract printEntry(logEntry: LogEntry): void
    abstract defaultLogger(): AbstractLogger

    #createLogEntry(
        targetLevel: LogLevel,
        message: string,
        details?: Record<string, unknown>,
    ): Result<LogEntry> {
        const timestamp = DateTimeFormatter.format(new Date(), Format.full)
        if (!timestamp.isValid) {
            return Results.err(`failed to get timestamp: ` + timestamp.error)
        }

        const logEntry: LogEntry = {
            timestamp: timestamp.value,
            level: targetLevel.value,
            message,
            details,
        }

        return Results.ok(logEntry)
    }

    #log(targetLevel: LogLevel) {
        return (message: string, details?: Record<string, unknown>): void => {
            if (targetLevel.level >= this.currentLevel.level) {
                const logEntry = this.#createLogEntry(
                    targetLevel,
                    message,
                    details,
                )
                if (!logEntry.isValid) {
                    this.error(logEntry.error)
                    return
                }

                this.printEntry(logEntry.value)
            }
        }
    }

    info = this.#log(LogLevel.Info)
    warn = this.#log(LogLevel.Warn)
    error = this.#log(LogLevel.Error)
}

export class Logger extends AbstractLogger {
    #defaultLogger?: Logger

    constructor(writer: Writer, level: LogLevel) {
        super(writer, level)
    }

    defaultLogger(): Logger {
        if (!this.#defaultLogger) {
            this.#defaultLogger = new Logger(ConsoleWriter, LogLevel.Info)
        }
        return this.#defaultLogger
    }

    printEntry(logEntry: LogEntry): void {
        const builder = new StringBuilder()
        builder.append(
            `${logEntry.timestamp} - ${logEntry.level} - ${logEntry.message}`,
        )

        if (logEntry.details) {
            for (const [key, value] of Object.entries(logEntry.details)) {
                builder.append(`, ${key}: '${value}'`)
            }
        }

        this.writer.write(builder.toString())
    }
}

export class JsonLogger extends AbstractLogger {
    #defaultLogger?: Logger

    constructor(writer: Writer, level: LogLevel) {
        super(writer, level)
    }

    defaultLogger(): Logger {
        if (!this.#defaultLogger) {
            this.#defaultLogger = new JsonLogger(ConsoleWriter, LogLevel.Info)
        }
        return this.#defaultLogger
    }

    printEntry(logEntry: LogEntry): void {
        const encoded = Results.of(() => JSON.stringify(logEntry))
        if (!encoded.isValid) {
            this.error("failed to json encode log entry", {
                error: encoded.error,
            })
            return
        }
        this.writer.write(encoded.value)
    }
}
