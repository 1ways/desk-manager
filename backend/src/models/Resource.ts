import mongoose from "mongoose"

const resourceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ["desk", "room"], required: true },
    location: { type: String, required: true },
    status: { type: String, enum: ["active", "maintenance"], default: "active" },
    meshName: { type: String, trim: true, unique: true, sparse: true }
})

export default mongoose.model("Resource", resourceSchema)