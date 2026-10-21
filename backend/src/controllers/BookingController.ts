import { Response } from "express"
import Booking from "../models/Booking"
import Resource from "../models/Resource"
import { AuthRequest } from "../middleware/auth"
import { overlapFilter } from "../utils/bookingOverlap"

export const createBooking = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { resourceId, startTime, endTime } = req.body
        const userId = req.user?.userId

        const resource = await Resource.findById(resourceId)
        if (!resource) return res.status(404).json({ message: "Resource not found" })
        if (resource.status !== "active") return res.status(400).json({ message: "Resource is unavailable (under maintenance)" })

        const conflict = await Booking.findOne({
            resourceId,
            status: "confirmed",
            ...overlapFilter(new Date(startTime), new Date(endTime))
        })

        if (conflict) {
            return res.status(409).json({ message: "This time slot is already reserved (conflict)" })
        }

        const newBooking = new Booking({
            userId,
            resourceId,
            startTime: new Date(startTime),
            endTime: new Date(endTime)
        })

        await newBooking.save()
        res.status(201).json({ message: "Booking successful", booking: newBooking })
    } catch (error) {
        res.status(500).json({ message: "Error creating a booking", error })
    }
}

export const getMyBookings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const bookings = await Booking.find({ userId: req.user?.userId })
            .populate("resourceId", "name type location")
            .sort({ startTime: 1 })

        res.json(bookings)
    } catch (error) {
        res.status(500).json({ message: "Error retrieving bookings", error })
    }
}

export const cancelBooking = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params
        const booking = await Booking.findById(id)

        if (!booking) return res.status(404).json({ message: "Booking not found" })

        if (booking.userId.toString() !== req.user?.userId && req.user?.role !== "admin") {
            return res.status(403).json({ message: "You cannot cancel someone else's booking" })
        }

        booking.status = "cancelled"
        await booking.save()

        res.json({ message: "The booking has been canceled" })
    } catch (error) {
        res.status(500).json({ message: "Error during cancellation", error })
    }
}

export const getAllBookings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const bookings = await Booking.find()
            .populate("userId", "firstName lastName email")
            .populate("resourceId", "name type location")
            .sort({ startTime: -1 })

        res.json(bookings)
    } catch (error) {
        res.status(500).json({ message: "Server error", error })
    }
}