import { Router } from "express"
import { authenticate, authorizeAdmin } from "../middleware/auth"
import { createResource, deleteResource, getAllResources, updateResource } from "../controllers/ResourceController"

const router = Router()

router.get("/", authenticate, getAllResources)

router.post("/", authenticate, authorizeAdmin, createResource)
router.put("/:id", authenticate, authorizeAdmin, updateResource)
router.delete("/:id", authenticate, authorizeAdmin, deleteResource)

export default router