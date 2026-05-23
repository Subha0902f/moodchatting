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
// import { protect } from "../middleware/authMiddleware"; // Assumes auth middleware exists

const router = Router();

router.get("/", getAllBlogs);
router.post("/", createBlog); // protect,
router.get("/search", searchBlogs);
router.get("/saved", getSavedBlogs); // protect,
router.get("/author/:authorId", getBlogsByAuthor);
router.get("/tags/:tag", getBlogsByTag);
router.get("/:blogId", getBlogById);
router.patch("/:blogId", updateBlog); // protect,
router.delete("/:blogId", deleteBlog); // protect,
router.post("/:blogId/save", saveBlog); // protect,
router.delete("/:blogId/unsave", unsaveBlog); // protect,
router.get("/:blogId/is-saved", checkSavedStatus); // protect,
router.patch("/:blogId/status", changeBlogStatus); // protect,

export default router;
