import { Request, Response } from "express"
import Resource from "../models/Resource"
import Booking from "../models/Booking"
import { overlapFilter } from "../utils/bookingOverlap"
import { isDuplicateKeyError } from "../utils/mongoErrors"

export type Availability = "free" | "booked" | "maintenance"

const isBlank = (value: unknown): boolean => typeof value === "string" && value.trim() === ""

export const getAllResources = async (req: Request, res: Response): Promise<void> => {
    try {
        const filter = req.query.all === "true" ? {} : { status: "active" as const }
        const resources = await Resource.find(filter)
        res.status(200).json(resources)
    } catch (error) {
        res.status(500).json({ message: "Error retrieving resources", error })
    }
}

export const createResource = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, type, location, status, meshName } = req.body

        const newResource = new Resource({
            name,
            type,
            location,
            status,
            meshName: isBlank(meshName) ? undefined : meshName
        })

        await newResource.save()
        res.status(201).json({ message: "The resource has been successfully created", resource: newResource })
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            res.status(409).json({ message: "meshName is already used by another resource" })
            return
        }
        res.status(500).json({ message: "Error creating a resource", error })
    }
}

export const updateResource = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params
        const { meshName, ...rest } = req.body

        const updatedData = isBlank(meshName) ? { $set: rest, $unset: { meshName: 1 } } : req.body

        const resource = await Resource.findByIdAndUpdate(id, updatedData, { returnDocument: "after", runValidators: true })

        if (!resource) {
            return res.status(404).json({ message: "Resource not found" })
        }

        res.json({ message: "The resource has been updated", resource })
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return res.status(409).json({ message: "meshName is already used by another resource" })
        }
        res.status(500).json({ message: "Error during update", error })
    }
}

export const deleteResource = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params
        const resource = await Resource.findByIdAndDelete(id)

        if (!resource) {
            return res.status(404).json({ message: "Resource not found" })
        }

        res.json({ message: "The resource has been successfully deleted" })
    } catch (error) {
        res.status(500).json({ message: "Error during deletion", error })
    }
}

export const getResourcesAvailability = async (req: Request, res: Response): Promise<any> => {
    try {
        const { from, to } = req.query

        if (typeof from !== "string" || typeof to !== "string") {
            return res.status(400).json({ message: "Query parameters from and to are required" })
        }

        const fromDate = new Date(from)
        const toDate = new Date(to)

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || fromDate >= toDate) {
            return res.status(400).json({ message: "Invalid time range" })
        }

        const busyIds = await Booking.distinct("resourceId", {
            status: "confirmed",
            ...overlapFilter(fromDate, toDate)
        })
        const busy = new Set(busyIds.map(id => String(id)))

        const resources = await Resource.find().lean()

        const result = resources.map(resource => {
            let availability: Availability = "free"

            if (resource.status === "maintenance") {
                availability = "maintenance"
            } else if (busy.has(String(resource._id))) {
                availability = "booked"
            }

            return { ...resource, availability }
        })

        res.json(result)
    } catch (error) {
        res.status(500).json({ message: "Error checking availability", error })
    }
}