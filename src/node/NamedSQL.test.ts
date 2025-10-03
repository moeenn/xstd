import test from "node:test"
import assert from "node:assert/strict"
import { MissingArgumentError, named } from "./NamedSQL.js"

test("basic scenario", () => {
    const input = `
	    insert into "user" (id, email, password, role, created_at)
	    values (:id, :email, :password, :role, :created_at)
	`

    const expectedQuery = `
	    insert into "user" (id, email, password, role, created_at)
	    values ($1, $2, $3, $4, $5)
	`.trim()

    const inputParams = {
        id: crypto.randomUUID(),
        email: "admin@site.com",
        password: "1knclskcnlc",
        role: "ADMIN",
        created_at: new Date(),
    }

    const expectedParams = [
        inputParams.id,
        inputParams.email,
        inputParams.password,
        inputParams.role,
        inputParams.created_at.toISOString(),
    ]

    const got = named(input, inputParams)
    assert.deepEqual(got, [expectedQuery, expectedParams])
})

test("repeated params", () => {
    const input = `
        insert into record (id, name, created_at, updated_at)
        values (:id, :name, :created_at, :created_at)
    `

    const expectedQuery = `
        insert into record (id, name, created_at, updated_at)
        values ($1, $2, $3, $3)
    `.trim()

    const inputParams = {
        id: 300,
        name: "admin",
        created_at: new Date(),
    }

    const expectedParams = [
        inputParams.id.toString(),
        inputParams.name,
        inputParams.created_at.toISOString(),
    ]

    const got = named(input, inputParams)
    assert.deepEqual(got, [expectedQuery, expectedParams])
})

test("missing argument", () => {
    const input = `
        select * from entity
        limit :limit
        offset :offset
    `

    const inputParms = {
        limit: 20,
    }

    let missingErr: MissingArgumentError | null = null
    try {
        named(input, inputParms)
    } catch (err) {
        assert(err instanceof MissingArgumentError)
        missingErr = err
    }

    assert(missingErr != null)
    assert(missingErr.arg == "offset")
})

class Entity {
    constructor(
        public id: number,
        public fullName: string,
    ) {}
}

test("camelCase args", () => {
    const inputQuery = `
        insert into entity (id, full_name)
        values (:id, :fullName)
    `

    const expectedQuery = `
        insert into entity (id, full_name)
        values ($1, $2)
    `.trim()

    const inputEntity = new Entity(300, "Something Random")
    const expectedParams = [inputEntity.id.toString(), inputEntity.fullName]

    const got = named(inputQuery, { ...inputEntity })
    assert.deepEqual(got, [expectedQuery, expectedParams])
})
