import assert from "node:assert/strict"
import { it } from "node:test"
import { Argparse } from "./Argparse.js"

type CommandLineArgs = {
    url: string
    outputFile: string
}

it("some simple arguments", () => {
    const inputArgs = [
        "node",
        "/some/test/script.js",
        "-url=site.com",
        "-outputFile=report.json",
    ]

    const parser = new Argparse(inputArgs)
    {
        parser.setProgramDescription("Batch download images from websites.")
        parser.addOption("url", "URL of the site to scrape.")
        parser.addOption("outputFile", "path of the output file.")
    }

    const args = parser.parse<CommandLineArgs>()
    assert.equal(args.url, "site.com")
    assert.equal(args.outputFile, "report.json")
    assert.equal(parser.scriptName, "script.js")
})

// TODO: add more tests.
