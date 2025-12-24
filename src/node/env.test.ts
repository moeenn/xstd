import test from "node:test"
import assert from "node:assert/strict"
import { Env } from "./env.ts"

test("read strings and numbers", () => {
    const env = new Env({
        TEST: "test",
        TEST_NUMBER: "1",
    })

    const value = env.readString("TEST")
    assert(value === "test")

    const num = env.readNumber("TEST_NUMBER")
    assert(num === 1)
})
