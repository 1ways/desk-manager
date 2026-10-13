import { Request, Response } from "express"
import Booking from "../models/Booking"

export const getAvailability = async (req: Request, res: Response) => {
    try {
        const { date } = req.query

        if (!date) {
            return res.status(400).json({ message: "Date query parameter is required (YYYY-MM-DD)" })
        }

        const searchDate = new Date(date as string)
        const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0))
        const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999))

        const bookings = await Booking.find({
            startTime: { $gt: startOfDay, $lt: endOfDay }
        }).select("resourceId startTime endTime -_id")

        res.status(200).json(bookings)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server error while fetching availability" })
    }
}