import { Router } from "express";

import {
  acceptFriendRequest,
  blockUser,
  cancelFriendRequest,
  checkFriendshipStatus,
  getFriendRecord,
  getFriends,
  getPendingRequests,
  getSentRequests,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "../controllers/friendcontroller";

const router = Router();

router.get("/", getFriends);
router.get("/status", checkFriendshipStatus);
router.get("/requests/pending", getPendingRequests);
router.get("/requests/sent", getSentRequests);
router.post("/requests", sendFriendRequest);
router.patch("/requests/:friendId/accept", acceptFriendRequest);
router.patch("/requests/:friendId/reject", rejectFriendRequest);
router.delete("/requests/:friendId", cancelFriendRequest);
router.patch("/:friendId/block", blockUser);
router.get("/:friendId", getFriendRecord);
router.delete("/:friendId", removeFriend);

export default router;
