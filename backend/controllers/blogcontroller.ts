import { Request, Response } from "express";
import BlogModel from "../models/blogModel";
import { createHttpError, sendRouteError } from "../routes/routeUtils";

// A more type-safe request object
interface RequestWithUser extends Request {
  user?: { id: string; [key: string]: any };
}
const DEMO_USER_ID = "c91f2c3a-5c3c-4c3c-8c3c-3c3c3c3c3c3c";

export const getAllBlogs = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const blogs = await BlogModel.getAll(limit, offset);
    res.status(200).json({ success: true, data: blogs });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const getBlogById = async (req: Request, res: Response) => {
  try {
    const blogId = req.params.blogId as string;
    const blog = await BlogModel.getById(blogId);
    if (!blog) {
      throw createHttpError(404, "Blog not found");
    }
    // Not waiting for this promise to resolve to speed up response time
    BlogModel.incrementViews(blogId).catch(console.error);
    res.status(200).json({ success: true, data: blog });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const createBlog = async (req: RequestWithUser, res: Response) => {
  try {
    // In a real app, author_id would come from the authenticated user session
    const author_id = req.user?.id || DEMO_USER_ID; // Demo User ID
    const newBlog = await BlogModel.create({ ...req.body, author_id });
    res.status(201).json({ success: true, data: newBlog });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const updateBlog = async (req: RequestWithUser, res: Response) => {
  try {
    const blogId = req.params.blogId as string;
    // Add authorization check here to ensure only the author can update
    const updatedBlog = await BlogModel.update(blogId, req.body);
    res.status(200).json({ success: true, data: updatedBlog });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const deleteBlog = async (req: RequestWithUser, res: Response) => {
  try {
    const blogId = req.params.blogId as string;
    // Add authorization check here
    await BlogModel.delete(blogId);
    res.status(200).json({ success: true, message: "Blog deleted" });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const searchBlogs = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      throw createHttpError(400, "Search query 'q' is required");
    }
    const blogs = await BlogModel.search(query);
    res.status(200).json({ success: true, data: blogs });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const getBlogsByTag = async (req: Request, res: Response) => {
  try {
    const tag = req.params.tag as string;
    const blogs = await BlogModel.getByTag(tag);
    res.status(200).json({ success: true, data: blogs });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const getBlogsByAuthor = async (req: Request, res: Response) => {
  try {
    const authorId = req.params.authorId as string;
    const blogs = await BlogModel.getByAuthor(authorId);
    res.status(200).json({ success: true, data: blogs });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const saveBlog = async (req: RequestWithUser, res: Response) => {
  try {
    const blogId = req.params.blogId as string;
    const userId = req.user?.id || DEMO_USER_ID; // Assuming user ID is on request
    if (!userId) throw createHttpError(401, "Authentication required");

    const savedBlog = await BlogModel.save(userId, blogId);
    res.status(201).json({ success: true, data: savedBlog });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const unsaveBlog = async (req: RequestWithUser, res: Response) => {
  try {
    const blogId = req.params.blogId as string;
    const userId = req.user?.id || DEMO_USER_ID;
    if (!userId) throw createHttpError(401, "Authentication required");

    await BlogModel.unsave(userId, blogId);
    res.status(200).json({ success: true, message: "Blog unsaved" });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const getSavedBlogs = async (req: RequestWithUser, res: Response) => {
    try {
        const userId = req.user?.id || DEMO_USER_ID;
        if (!userId) throw createHttpError(401, "Authentication required");

        const blogs = await BlogModel.getSavedByUser(userId);
        res.status(200).json({ success: true, data: blogs });
    } catch (error: any) {
        sendRouteError(res, error);
    }
};

export const changeBlogStatus = async (req: RequestWithUser, res: Response) => {
    try {
        const blogId = req.params.blogId as string;
        const { status } = req.body;

        if (!status || !["draft", "published", "archived"].includes(status)) {
            throw createHttpError(400, "Invalid status provided.");
        }

        // Authorization check should be here
        const blog = await BlogModel.setStatus(blogId, status);
        res.status(200).json({ success: true, data: blog });
    } catch (error: any) {
        sendRouteError(res, error);
    }
};

export const checkSavedStatus = async (req: RequestWithUser, res: Response) => {
    try {
        const blogId = req.params.blogId as string;
        const userId = req.user?.id || DEMO_USER_ID;
        if (!userId) throw createHttpError(401, "Authentication required");

        const isSaved = await BlogModel.isSaved(userId, blogId);
        res.status(200).json({ success: true, data: { isSaved } });
    } catch (error: any) {
        sendRouteError(res, error);
    }
};