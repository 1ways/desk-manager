import { Request, Response } from "express"
import Resource from "../models/Resource"

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
        const { name, type, location, status } = req.body

        const newResource = new Resource({
            name,
            type,
            location,
            status
        })

        await newResource.save()
        res.status(201).json({ message: "The resource has been successfully created", resource: newResource })
    } catch (error) {
        res.status(500).json({ message: "Error creating a resource", error })
    }
}

export const updateResource = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params
        const updatedData = req.body

        const resource = await Resource.findByIdAndUpdate(id, updatedData, { new: true })

        if (!resource) {
            return res.status(404).json({ message: "Resource not found" })
        }

        res.json({ message: "The resource has been updated", resource })
    } catch (error) {
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