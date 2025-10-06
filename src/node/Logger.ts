import { DateTimeFormatter, Format } from "#src/core/DateTimeFormatter.js"
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
            env = new Env(process.env)
        }

        const envValue = env.readString(key)
        if (envValue.isError) {
            return envValue
        }

        const foundLevel = levels.find((level) => level.value === envValue.value)
        if (!foundLevel) {
            return Results.err(
                `unknown value for environment variable ${key}: ${envValue.value}`,
            )
        }

        return Results.ok(foundLevel)
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

export abstract class AbstractLogger {
    protected currentLevel: LogLevel
    protected writer: Writer

    constructor(level?: LogLevel, writer?: Writer) {
        this.currentLevel = level ?? LogLevel.Info
        this.writer = writer ?? new ConsoleWriter()
    }

    // eslint-disable-next-line no-unused-vars
    abstract printEntry(logEntry: LogEntry): void

    #createLogEntry(
        targetLevel: LogLevel,
        message: string,
        details?: Record<string, unknown>,
    ): Result<LogEntry> {
        const timestamp = DateTimeFormatter.format(new Date(), Format.full)
        if (timestamp.isError) {
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
                if (logEntry.isError) {
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
    static #defaultLogger?: Logger

    constructor(level?: LogLevel, writer?: Writer) {
        super(level, writer)
    }

    static DefaultLogger(): Logger {
        if (!Logger.#defaultLogger) {
            Logger.#defaultLogger = new Logger(
                LogLevel.Info,
                new ConsoleWriter(),
            )
        }
        return Logger.#defaultLogger
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
    static #defaultLogger?: JsonLogger

    constructor(level?: LogLevel, writer?: Writer) {
        super(level, writer)
    }

    static DefaultLogger(): Logger {
        if (!JsonLogger.#defaultLogger) {
            JsonLogger.#defaultLogger = new JsonLogger(
                LogLevel.Info,
                new ConsoleWriter(),
            )
        }
        return JsonLogger.#defaultLogger
    }

    printEntry(logEntry: LogEntry): void {
        const payload = { ...logEntry, ...logEntry.details, details: undefined }
        const encoded = Results.of(() => JSON.stringify(payload))
        if (encoded.isError) {
            return this.error("failed to json encode log entry", {
                error: encoded.error,
            })
        }
        this.writer.write(encoded.value)
    }
}
