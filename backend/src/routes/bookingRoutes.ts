import { Router } from "express"
import { authenticate, authorizeAdmin } from "../middleware/auth"
import { cancelBooking, createBooking, getAllBookings, getMyBookings } from "../controllers/BookingController"

const router = Router()

router.post("/", authenticate, createBooking)
router.get("/me", authenticate, getMyBookings)
router.patch("/:id/cancel", authenticate, cancelBooking)

router.get("/all", authenticate, authorizeAdmin, getAllBookings)

export default router