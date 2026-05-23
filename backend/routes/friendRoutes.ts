import { Router } from "express";

import {
  addFriend,
  createFriendRequest,
  listFriends,
  removeFriend,
  updateFriendship,
} from "../controllers/friendcontroller";

const router = Router();

router.get("/", listFriends);
router.post("/", addFriend);
router.post("/requests", createFriendRequest);
router.patch("/:friendId", updateFriendship);
router.delete("/:friendId", removeFriend);

export default router;