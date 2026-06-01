import { Router } from "express";
import {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  searchBlogs,
  getBlogsByTag,
  getBlogsByAuthor,
  saveBlog,
  unsaveBlog,
  getSavedBlogs,
  changeBlogStatus,
  checkSavedStatus,
} from "../controllers/blogcontroller";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.get("/", getAllBlogs);
router.post("/", protect, createBlog);
router.get("/search", searchBlogs);
router.get("/saved", protect, getSavedBlogs);
router.get("/author/:authorId", getBlogsByAuthor);
router.get("/tags/:tag", getBlogsByTag);
router.get("/:blogId", getBlogById);
router.patch("/:blogId", protect, updateBlog);
router.delete("/:blogId", protect, deleteBlog);
router.post("/:blogId/save", protect, saveBlog);
router.delete("/:blogId/unsave", protect, unsaveBlog);
router.get("/:blogId/is-saved", protect, checkSavedStatus);
router.patch("/:blogId/status", protect, changeBlogStatus);

export default router;
