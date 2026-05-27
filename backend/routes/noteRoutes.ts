import { Router, Request, Response } from "express";
import noteModel from "../models/notemodel";
import { createHttpError, sendRouteError } from "./routeUtils";
import { User } from "../types/user.types";

interface RequestWithUser extends Request {
  user?: User;
}

const router = Router();

router.get("/", async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw createHttpError(401, "Authentication required");

    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const notes = search
      ? await noteModel.search(userId, search)
      : await noteModel.getByUser(userId);

    console.log(`[notes] fetched ${notes.length} note(s) for user ${userId}`);
    return res.status(200).json({ success: true, data: notes });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
});

router.post("/", async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw createHttpError(401, "Authentication required");

    const title = String(req.body?.title ?? "").trim() || "Untitled";
    const content = String(req.body?.content ?? "");

    const note = await noteModel.create({
      userId,
      title,
      content,
      color: req.body?.color,
      isPinned: req.body?.isPinned,
      tags: Array.isArray(req.body?.tags) ? req.body.tags : [],
    });

    console.log(`[notes] inserted note ${note.id} for user ${userId}`);
    return res.status(201).json({ success: true, data: note });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
});

router.put("/:id", async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw createHttpError(401, "Authentication required");

    const noteId = String(req.params.id);
    const existing = await noteModel.getById(noteId);
    if (!existing) throw createHttpError(404, "Note not found");
    if (existing.userId !== userId) throw createHttpError(403, "You can only update your own notes");

    const note = await noteModel.update(noteId, {
      title: req.body?.title,
      content: req.body?.content,
      color: req.body?.color,
      isPinned: req.body?.isPinned,
      tags: req.body?.tags,
    });

    console.log(`[notes] updated note ${note.id} for user ${userId}`);
    return res.status(200).json({ success: true, data: note });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
});

router.delete("/:id", async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw createHttpError(401, "Authentication required");

    const noteId = String(req.params.id);
    const existing = await noteModel.getById(noteId);
    if (!existing) throw createHttpError(404, "Note not found");
    if (existing.userId !== userId) throw createHttpError(403, "You can only delete your own notes");

    await noteModel.delete(noteId);
    console.log(`[notes] deleted note ${noteId} for user ${userId}`);
    return res.status(200).json({ success: true, data: existing });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
});

export default router;
