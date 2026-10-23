import "dotenv/config"
import mongoose from "mongoose"
import app from "./app"

const PORT = process.env.PORT || 5000

mongoose.connect(process.env.MONGO_URI as string)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch((err) => console.error("MongoDB connection error:", err))

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})