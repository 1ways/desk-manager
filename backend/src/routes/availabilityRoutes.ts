import { Router } from "express"
import { authenticate } from "../middleware/auth"
import { getAvailability } from "../controllers/AvailabilityController"

const router = Router()

router.get("/", authenticate, getAvailability)

export default router