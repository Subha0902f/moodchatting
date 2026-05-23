import { Router } from "express";
import { 
  createThread,
  createThreadMessage,
  deleteThread,
  getThread,
  listThreadMessages,
  listThreads,
  updateThread,
} from "../controllers/chatcontroller";

const router = Router();

router.get("/threads", listThreads);
router.post("/threads", createThread);
router.get("/threads/:threadId", getThread);
router.patch("/threads/:threadId", updateThread);
router.delete("/threads/:threadId", deleteThread);
router.get("/threads/:threadId/messages", listThreadMessages);
router.post("/threads/:threadId/messages", createThreadMessage);

export default router;
