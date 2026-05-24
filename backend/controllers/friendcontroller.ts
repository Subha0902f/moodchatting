import { Request, Response } from "express";
import { User } from "../types/user.types";
import FriendModel from "../models/friendModel";
import { createHttpError, sendRouteError } from "../routes/routeUtils";

// A more type-safe request object
interface RequestWithUser extends Request {
  user?: User;
}

// ─── Send Friend Request ───────────────────────────────────────────────────────

export const sendFriendRequest = async (req: RequestWithUser, res: Response) => {
  try {
    const { targetUserId } = req.body;
    const requesterId = req.user?.id;
    if (!requesterId) {
      throw createHttpError(401, "Authentication required");
    }

    if (!targetUserId) {
      throw createHttpError(400, "Target user ID is required");
    }

    if (requesterId === targetUserId) {
      throw createHttpError(400, "Cannot send friend request to yourself");
    }

    // Check if a pending request already exists
    const hasPending = await FriendModel.hasPendingRequest(requesterId, targetUserId);
    if (hasPending) {
      throw createHttpError(409, "Friend request already pending");
    }

    // Check if they are already friends
    const areFriends = await FriendModel.areFriends(requesterId, targetUserId);
    if (areFriends) {
      throw createHttpError(409, "Already friends with this user");
    }

    const friendRequest = await FriendModel.create({
      requesterId,
      addresseeId: targetUserId,
      status: "pending",
    });

    res.status(201).json({ success: true, data: friendRequest });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

// ─── Get Pending Friend Requests ───────────────────────────────────────────────

export const getPendingRequests = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw createHttpError(401, "Authentication required");
    }
    const requests = await FriendModel.getPendingRequests(userId);
    res.status(200).json({ success: true, data: requests });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

// ─── Get Sent Friend Requests ──────────────────────────────────────────────────

export const getSentRequests = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw createHttpError(401, "Authentication required");
    }
    const requests = await FriendModel.getSentRequests(userId);
    res.status(200).json({ success: true, data: requests });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

// ─── Accept Friend Request ─────────────────────────────────────────────────────

export const acceptFriendRequest = async (req: RequestWithUser, res: Response) => {
  try {
    const friendId = req.params.friendId as string;
    const userId = req.user?.id;
    if (!userId) {
      throw createHttpError(401, "Authentication required");
    }

    // Verify the user is the addressee of the request
    const friendRecord = await FriendModel.getById(friendId);
    if (!friendRecord) {
      throw createHttpError(404, "Friend request not found");
    }

    if (friendRecord.addresseeId !== userId) {
      throw createHttpError(403, "Not authorized to accept this request");
    }

    if (friendRecord.status !== "pending") {
      throw createHttpError(400, "Friend request is no longer pending");
    }

    const updatedFriend = await FriendModel.acceptRequest(friendId);
    res.status(200).json({ success: true, data: updatedFriend });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

// ─── Reject Friend Request ─────────────────────────────────────────────────────

export const rejectFriendRequest = async (req: RequestWithUser, res: Response) => {
  try {
    const friendId = req.params.friendId as string;
    const userId = req.user?.id;
    if (!userId) {
      throw createHttpError(401, "Authentication required");
    }

    // Verify the user is the addressee of the request
    const friendRecord = await FriendModel.getById(friendId);
    if (!friendRecord) {
      throw createHttpError(404, "Friend request not found");
    }

    if (friendRecord.addresseeId !== userId) {
      throw createHttpError(403, "Not authorized to reject this request");
    }

    const updatedFriend = await FriendModel.rejectRequest(friendId);
    res.status(200).json({ success: true, data: updatedFriend });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

// ─── Cancel Friend Request ─────────────────────────────────────────────────────

export const cancelFriendRequest = async (req: RequestWithUser, res: Response) => {
  try {
    const friendId = req.params.friendId as string;
    const userId = req.user?.id;
    if (!userId) {
      throw createHttpError(401, "Authentication required");
    }

    // Verify the user is the requester
    const friendRecord = await FriendModel.getById(friendId);
    if (!friendRecord) {
      throw createHttpError(404, "Friend request not found");
    }

    if (friendRecord.requesterId !== userId) {
      throw createHttpError(403, "Not authorized to cancel this request");
    }

    await FriendModel.cancelRequest(friendId);
    res.status(200).json({ success: true, message: "Friend request cancelled" });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

// ─── Block User ────────────────────────────────────────────────────────────────

export const blockUser = async (req: RequestWithUser, res: Response) => {
  try {
    const friendId = req.params.friendId as string;
    const userId = req.user?.id;
    if (!userId) {
      throw createHttpError(401, "Authentication required");
    }

    const friendRecord = await FriendModel.getById(friendId);
    if (!friendRecord) {
      throw createHttpError(404, "Record not found");
    }

    // Either party can block
    if (friendRecord.requesterId !== userId && friendRecord.addresseeId !== userId) {
      throw createHttpError(403, "Not authorized to block this user");
    }

    const updatedFriend = await FriendModel.blockUser(friendId);
    res.status(200).json({ success: true, data: updatedFriend });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

// ─── Get Friends List ──────────────────────────────────────────────────────────

export const getFriends = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw createHttpError(401, "Authentication required");
    }
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const friends = await FriendModel.getFriends(userId, limit, offset);
    res.status(200).json({ success: true, data: friends });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

// ─── Remove Friend ─────────────────────────────────────────────────────────────

export const removeFriend = async (req: RequestWithUser, res: Response) => {
  try {
    const friendId = req.params.friendId as string;
    const userId = req.user?.id;
    if (!userId) {
      throw createHttpError(401, "Authentication required");
    }

    const friendRecord = await FriendModel.getById(friendId);
    if (!friendRecord) {
      throw createHttpError(404, "Friend record not found");
    }

    // Either party can remove the friendship
    if (friendRecord.requesterId !== userId && friendRecord.addresseeId !== userId) {
      throw createHttpError(403, "Not authorized to remove this friendship");
    }

    await FriendModel.delete(friendId);
    res.status(200).json({ success: true, message: "Friend removed" });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

// ─── Check Friendship Status ───────────────────────────────────────────────────

export const checkFriendshipStatus = async (req: RequestWithUser, res: Response) => {
  try {
    const { userId } = req.query;
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      throw createHttpError(401, "Authentication required");
    }

    if (!userId) {
      throw createHttpError(400, "User ID is required");
    }

    if (currentUserId === userId) {
      res.status(200).json({ success: true, data: { areFriends: false, status: "self" } });
      return;
    }

    const friendRecord = await FriendModel.getBetweenUsers(currentUserId, userId as string);

    if (!friendRecord) {
      res.status(200).json({ success: true, data: { areFriends: false, status: "none" } });
    } else {
      res.status(200).json({
        success: true,
        data: {
          areFriends: friendRecord.status === "accepted",
          status: friendRecord.status,
          isRequester: friendRecord.requesterId === currentUserId,
        },
      });
    }
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

// ─── Get Friend by Record ID ───────────────────────────────────────────────────

export const getFriendRecord = async (req: RequestWithUser, res: Response) => {
  try {
    const friendId = req.params.friendId as string;
    const friendRecord = await FriendModel.getById(friendId);

    if (!friendRecord) {
      throw createHttpError(404, "Friend record not found");
    }

    res.status(200).json({ success: true, data: friendRecord });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};
