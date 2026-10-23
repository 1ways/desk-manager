import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest"
import { MongoMemoryServer } from "mongodb-memory-server"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import request from "supertest"
import app from "../app"
import Resource from "../models/Resource"

const JWT_SECRET = "test-secret"

let mongo: MongoMemoryServer

beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET
    mongo = await MongoMemoryServer.create()
    await mongoose.connect(mongo.getUri())
    await Resource.init()
})

afterEach(async () => { await Resource.deleteMany({}) })
afterAll(async () => { await mongoose.disconnect(); await mongo.stop() })

const adminToken = (): string =>
    jwt.sign({ userId: new mongoose.Types.ObjectId().toString(), role: "admin" }, JWT_SECRET)

const postResource = (body: object) =>
    request(app)
        .post("/api/resources")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send(body)

const putResource = (id: string, body: object) =>
    request(app)
        .put(`/api/resources/${id}`)
        .set("Authorization", `Bearer ${adminToken()}`)
        .send(body)

describe("POST /api/resources", () => {
    it("returns 201 when resource is created", async () => {
        const res = await postResource({ name: "Desk 1", type: "desk", location: "Floor 1", meshName: "desk-01" })
        expect(res.status).toBe(201)

        const doc = await Resource.findById(res.body.resource._id).lean()
        expect(doc?.meshName).toBe("desk-01")
    })
    it("returns 409 when meshName is already used", async () => {
        await Resource.create({ name: "Desk 1", type: "desk", location: "Floor 1", meshName: "desk-01" })

        const res = await postResource({ name: "Desk 2", type: "desk", location: "Floor 1", meshName: "desk-01" })
        expect(res.status).toBe(409)
    })
    it("does not store an empty meshName", async () => {
        const res = await postResource({ name: "Desk 1", type: "desk", location: "Floor 1", meshName: "" })
        expect(res.status).toBe(201)

        const doc = await Resource.findById(res.body.resource._id).lean()
        expect(doc).not.toHaveProperty("meshName")
    })
    it("returns 201 for both '   ' meshName values", async () => {
        const res1 = await postResource({ name: "Desk 1", type: "desk", location: "Floor 1", meshName: "   " })
        const res2 = await postResource({ name: "Desk 2", type: "desk", location: "Floor 1", meshName: "   " })

        expect(res1.status).toBe(201)
        expect(res2.status).toBe(201)
    })
    it("returns 201 for two resources without meshName", async () => {
        const res1 = await postResource({ name: "Desk 1", type: "desk", location: "Floor 1" })
        const res2 = await postResource({ name: "Desk 2", type: "desk", location: "Floor 1" })

        expect(res1.status).toBe(201)
        expect(res2.status).toBe(201)
    })
})

describe("PUT /api/resources/:id", () => {
    it("returns 409 for the existing meshName", async () => {
        await Resource.create({ name: "Desk 1", type: "desk", location: "Floor 1", meshName: "desk-01" })
        const resource2 = await Resource.create({ name: "Desk 2", type: "desk", location: "Floor 1", meshName: "desk-02" })

        const res = await putResource(resource2.id, { meshName: "desk-01" })
        expect(res.status).toBe(409)
    })
    it("removes meshName when it is set to an empty string", async () => {
        const resource = await Resource.create({ name: "Desk 1", type: "desk", location: "Floor 1", meshName: "desk-01" })

        const res = await putResource(resource.id, { meshName: "" })
        expect(res.status).toBe(200)

        const doc = await Resource.findById(resource.id).lean()
        expect(doc).not.toHaveProperty("meshName")
    })
    it("returns 404 for non-existent ids", async () => {
        const id = new mongoose.Types.ObjectId().toString()

        const res = await putResource(id, { name: "X" })
        expect(res.status).toBe(404)
    })
})