import { Router } from "express";
import { login, logout, me, refresh, register } from "../controllers/authcontroller";

const router = Router(); //creating a new router

//defining routes for authentication endpoints and associating them with corresponding controller functions
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.get("/me", me);

export default router;
