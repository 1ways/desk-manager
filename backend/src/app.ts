import express, { Response } from "express"
import cors from "cors"
import authRoutes from "./routes/authRoutes"
import { authenticate, AuthRequest } from "./middleware/auth"
import resourceRoutes from "./routes/resourceRoutes"
import bookingRoutes from "./routes/bookingRoutes"
import userRoutes from "./routes/userRoutes"
import availabilityRoutes from "./routes/availabilityRoutes"

const app = express()
app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
    res.send("DeskManager API is running")
})

app.use("/api/auth", authRoutes)
app.use("/api/resources", resourceRoutes)
app.use("/api/bookings", bookingRoutes)
app.use("/api/users", userRoutes)
app.use("/api/availability", availabilityRoutes)

app.get("/api/protected", authenticate, (req: AuthRequest, res: Response) => {
    res.json({
        message: "Facecontrol is passed",
        user: req.user
    })
})

export default app