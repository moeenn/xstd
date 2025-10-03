import test from "node:test"
import assert from "node:assert/strict"
import { Time } from "./Time.js"

test("parse valid time", () => {
    const midnight = Time.of(12, 0)
    assert(midnight.isValid)
})
