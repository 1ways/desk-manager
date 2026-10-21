import { Request, Response } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import User from "../models/User"

export const register = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, firstName, lastName, password } = req.body

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ message: "A user with this email address already exists" })
        }

        const salt = await bcrypt.genSalt(10)
        const passwordHash = await bcrypt.hash(password, salt)

        const newUser = new User({
            email,
            firstName,
            lastName,
            passwordHash,
            role: "user"
        })

        await newUser.save()
        res.status(201).json({ message: "The user has been successfully created" })
    } catch (error) {
        res.status(500).json({ message: "Server error during registration", error })
    }
}

export const login = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password } = req.body

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({ message: "Incorrect email or password" })
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash)
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect email or password" })
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: "1d" }
        )

        res.json({
            token,
            user: { _id: user._id, email: user.email, role: user.role, firstName: user.firstName }
        })
    } catch (error) {
        res.status(500).json({ message: "Server error during login", error })
    }
}