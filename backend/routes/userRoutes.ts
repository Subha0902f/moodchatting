import { Router } from "express";
import { getMe, updateMe, searchUsers, getUser } from "../controllers/usercontroller";

const router = Router();

router.get("/search", searchUsers);
router.get("/me", getMe);
router.get("/:id", getUser);
router.put("/me", updateMe);
router.patch("/me", updateMe);

export default router;