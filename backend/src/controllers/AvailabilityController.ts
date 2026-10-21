import { Request, Response } from "express"
import mongoose from "mongoose"
import Booking from "../models/Booking"
import { overlapFilter } from "../utils/bookingOverlap"

export const getAvailability = async (req: Request, res: Response): Promise<any> => {
    try {
        const { from, to, resourceId } = req.query

        if (typeof from !== "string" || typeof to !== "string") {
            return res.status(400).json({ message: "Query parameters from and to are required" })
        }

        const fromDate = new Date(from)
        const toDate = new Date(to)

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || fromDate >= toDate) {
            return res.status(400).json({ message: "Invalid time range" })
        }

        const filter: Record<string, unknown> = {
            status: "confirmed",
            ...overlapFilter(fromDate, toDate)
        }

        if (resourceId !== undefined) {
            if (typeof resourceId !== "string" || !mongoose.isValidObjectId(resourceId)) {
                return res.status(400).json({ message: "Invalid resourceId" })
            }
            filter.resourceId = resourceId
        }

        const bookings = await Booking.find(filter)
            .select("resourceId startTime endTime -_id")
            .sort({ startTime: 1 })

        res.status(200).json(bookings)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server error while fetching availability" })
    }
}