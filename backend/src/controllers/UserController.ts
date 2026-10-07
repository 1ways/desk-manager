import { Request, Response } from "express"
import User from "../models/User"
import { AuthRequest } from "../middleware/auth"

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await User.find().select("-passwordHash")
        res.json(users)
    } catch (error) {
        res.status(500).json({ message: "Server error", error })
    }
}

export const updateUserRole = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params
        const { role } = req.body

        if (role !== "admin" && role !== "user") {
            return res.status(400).json({ message: "Unknown role. Only admin or user are allowed." })
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true }
        ).select("-passwordHash")

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" })
        }

        res.json({ message: "The role has been successfully updated", user: updatedUser })
    } catch (error) {
        res.status(500).json({ message: "Error updating a role", error })
    }
}

export const deleteUser = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params
        if (req.user?.userId === id) return res.status(400).json({ message: "You cannot delete yourself" })

        const user = await User.findByIdAndDelete(id)

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        res.json({ message: "The user has been successfully deleted" })
    } catch (error) {
        res.status(500).json({ message: "Error while deleting a user", error })
    }
}