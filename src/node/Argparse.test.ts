import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { Argparse, type CliOption } from "./Argparse.js"

describe("argparse usage tests", () => {
    it("basic usage", () => {
        type CommandLineArgs = {
            url: string
            outputFile: string
        }

        const inputArgs = [
            "node",
            "/some/test/script.js",
            "-url=site.com",
            "-outputFile=report.json",
        ]

        const parser = new Argparse(inputArgs, [
            {
                name: "url",
                kind: "string",
                description: "URL of the site to scrape.",
                usage: "-url=http://site.com",
            },
            {
                name: "outputFile",
                kind: "string",
                description: "path of the output file.",
            },
        ])

        parser.setProgramDescription("Batch download images from websites.")
        const args = parser.parse<CommandLineArgs>()
        assert(args.isValid)
        assert.equal(args.value.url, "site.com")
        assert.equal(args.value.outputFile, "report.json")
        assert.equal(parser.scriptName, "script.js")
    })

    it("test arguments offset and boolean flags", () => {
        type CommandLineArgs = {
            version: boolean
            force: boolean
            verbose: boolean
        }

        const inputArgs = [
            "npm",
            "run",
            "/some/test/script.js",
            "-version",
            "-force=false",
            "-verbose=true",
        ]

        const cliOptions: CliOption[] = [
            {
                name: "version",
                kind: "boolean",
                description: "Get version of the application.",
            },
            {
                name: "force",
                kind: "boolean",
                description: "Force execution of program.",
            },
            {
                name: "verbose",
                kind: "boolean",
                description: "Increase program verbosity.",
            },
        ]

        const argsOffet = 3
        const parser = new Argparse(inputArgs, cliOptions, argsOffet)
        const parsedArgs = parser.parse<CommandLineArgs>()
        assert(parsedArgs.isValid)
        assert(parsedArgs.value.version)
        assert.equal(parsedArgs.value.force, false)
        assert(parsedArgs.value.verbose)
    })

    it("optional arguments", () => {
        type CommandLineArgs = {
            name?: string
        }

        const inputArgs = ["node", "/some/test/script.js"]
        const parser = new Argparse(inputArgs, [
            {
                name: "name",
                kind: "string",
                description: "name of the user",
                optional: true,
            },
        ])

        const parsedArgs = parser.parse<CommandLineArgs>()
        assert.equal(parsedArgs.isValid, true)
    })

    // TODO: test returned errors.
})
