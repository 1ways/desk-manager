import mongoose from "mongoose"

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
}, { timestamps: true })

export default mongoose.model("Booking", bookingSchema)