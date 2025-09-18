import { Argparse } from "./node/Argparse.js"
import process from "node:process"

function main() {
    const parser = new Argparse(process.argv, [
        {
            name: "url",
            kind: "string",
            description: "URL of the page to scrape",
        },
    ])

    const parsedArgs = parser.parse()
    if (!parsedArgs.isValid) {
        console.error("error: " + parsedArgs.error)
        return
    }

    console.log(parsedArgs.value)
}

main()
