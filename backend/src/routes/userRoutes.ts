import { Router } from "express"
import { authenticate, authorizeAdmin } from "../middleware/auth"
import { deleteUser, getAllUsers, updateUserRole } from "../controllers/UserController"

const router = Router()

router.get("/", authenticate, authorizeAdmin, getAllUsers)
router.patch("/:id/role", authenticate, authorizeAdmin, updateUserRole)
router.delete("/:id", authenticate, authorizeAdmin, deleteUser)

export default router