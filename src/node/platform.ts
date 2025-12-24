import process from "node:process"

export class Platform {
    static isWindows(): boolean {
        return process.platform === "win32"
    }

    static isUnixlike(): boolean {
        return process.platform in ["darwin", "freebsd", "linux", "openbsd", "android"]
    }

    static whoami(): string {
        const varname = Platform.isWindows() ? "USERNAME" : "USER"
        const user = process.env[varname]

        if (!user || user.trim() === "") {
            throw new Error(`env variable $${varname} not set`)
        }

        return user.trim()
    }

    static pwd(): string {
        return process.cwd()
    }

    static home(): string {
        return Platform.isWindows() ? process.env["USERPROFILE"]! : process.env["HOME"]!
    }
}
