import { Result, type result } from "./monads.ts"

type KnownType =
    | "String"
    | "Number"
    | "BigInt"
    | "Boolean"
    | "Array"
    | "Object"
    | "Set"
    | "Map"
    | "Blob"
    | "Buffer"
    | "ReadableStream"

export const Type: Record<KnownType, KnownType> = {
    String: "String",
    Number: "Number",
    BigInt: "BigInt",
    Boolean: "Boolean",
    Array: "Array",
    Object: "Object",
    Set: "Set",
    Map: "Map",
    Blob: "Blob",
    Buffer: "Buffer",
    ReadableStream: "ReadableStream",
}

type JsObject = {
    constructor: {
        name: string
    }
}

// TODO: consider if required.
function isType(input: JsObject, targetType: KnownType): boolean {
    const typeName = input.constructor.name
    switch (typeName) {
        case Type.Number:
            return !isNaN(input as number)

        default:
            return typeName === targetType
    }
}

// TODO: consider if required.
function getType(input: JsObject): result<KnownType> {
    const typeName = input.constructor.name
    for (const knownType of Object.values(Type)) {
        if (typeName === knownType) {
            return Result.ok(knownType)
        }
    }

    return Result.err("failed to find type")
}

export const Types = {
    isType,
    getType,
} as const
