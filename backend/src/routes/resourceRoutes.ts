import { Router } from "express"
import { authenticate, authorizeAdmin } from "../middleware/auth"
import { createResource, deleteResource, getAllResources, updateResource, getResourcesAvailability } from "../controllers/ResourceController"

const router = Router()

router.get("/", authenticate, getAllResources)
router.get("/availability", authenticate, getResourcesAvailability)

router.post("/", authenticate, authorizeAdmin, createResource)
router.put("/:id", authenticate, authorizeAdmin, updateResource)
router.delete("/:id", authenticate, authorizeAdmin, deleteResource)

export default router