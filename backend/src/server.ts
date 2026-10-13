import express, { Response } from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/authRoutes"
import { authenticate, AuthRequest } from "./middleware/auth"
import resourceRoutes from "./routes/resourceRoutes"
import bookingRoutes from "./routes/bookingRoutes"
import userRoutes from "./routes/userRoutes"
import availabilityRoutes from "./routes/availabilityRoutes"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 5000

mongoose.connect(process.env.MONGO_URI as string)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch((err) => console.error("MongoDB connection error:", err))

app.get("/", (req, res) => {
    res.send("DeskManager API is running")
})

app.use("/api/auth", authRoutes)
app.use("/api/resources", resourceRoutes)
app.use("/api/bookings", bookingRoutes)
app.use("/api/users", userRoutes)
app.use("/api/users", userRoutes)
app.use("/api/availability", availabilityRoutes)

app.get("/api/protected", authenticate, (req: AuthRequest, res: Response) => {
    res.json({
        message: "Facecontrol is passed",
        user: req.user
    })
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})