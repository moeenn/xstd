import test from "node:test"
import assert from "node:assert/strict"
import { Env } from "./Env.js"

test("read strings and numbers", () => {
    const env = new Env({
        TEST: "test",
        TEST_NUMBER: "1",
    })

    const value = env.readString("TEST")
    assert(!value.isError)
    assert(value.value === "test")

    const num = env.readNumber("TEST_NUMBER")
    assert(!num.isError)
    assert(num.value === 1)
})