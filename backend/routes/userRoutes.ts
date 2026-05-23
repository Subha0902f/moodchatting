import { Router } from "express";
import { getMe, updateMe } from "../controllers/usercontroller"; 
import { createCrudRoutes } from "./createCrudRoutes";

// Create standard CRUD routes for 'user'
const router = createCrudRoutes("user");

// Add specific routes for the authenticated user
router.get("/me", getMe);
router.put("/me", updateMe);
router.patch("/me", updateMe);

export default router;
