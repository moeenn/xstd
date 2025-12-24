import test from "node:test"
import assert from "node:assert/strict"
import { Time } from "./time.ts"

test("parse valid time", () => {
    const midnight = Time.of(12, 0)
    assert(midnight.to24HourString(), "12:00")
})
