import { supabaseAdmin as supabase } from "../config/supabase";
import { Request, Response } from "express";
import { User } from "../types/user.types";
import FriendModel from "../models/friendModel";
import { createHttpError, sendRouteError } from "../routes/routeUtils";

interface RequestWithUser extends Request {
  user?: User;
}

export const sendFriendRequest = async (req: RequestWithUser, res: Response) => {
  try {
    const { targetUserId } = req.body;
    const requesterId = req.user?.id;
    if (!requesterId) throw createHttpError(401, "Authentication required");
    if (!targetUserId) throw createHttpError(400, "Target user ID is required");
    if (requesterId === targetUserId) throw createHttpError(400, "Cannot send friend request to yourself");

    const hasPending = await FriendModel.hasPendingRequest(requesterId, targetUserId);
    if (hasPending) throw createHttpError(409, "Friend request already pending");

    const areFriends = await FriendModel.areFriends(requesterId, targetUserId);
    if (areFriends) throw createHttpError(409, "Already friends with this user");

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

export const getPendingRequests = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw createHttpError(401, "Authentication required");

    const requests = await FriendModel.getPendingRequests(userId);

    const enriched = await Promise.all(
      requests.map(async (r) => {
        const { data: user } = await supabase
          .from("users")
          .select("id, username")
          .eq("id", r.requesterId)
          .single();
        return { ...r, sender: user };
      })
    );

    res.status(200).json({ success: true, data: enriched });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const getSentRequests = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw createHttpError(401, "Authentication required");
    const requests = await FriendModel.getSentRequests(userId);
    res.status(200).json({ success: true, data: requests });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const acceptFriendRequest = async (req: RequestWithUser, res: Response) => {
  try {
    const friendId = req.params.friendId as string;
    const userId = req.user?.id;
    if (!userId) throw createHttpError(401, "Authentication required");

    const friendRecord = await FriendModel.getById(friendId);
    if (!friendRecord) throw createHttpError(404, "Friend request not found");
    if (friendRecord.addresseeId !== userId) throw createHttpError(403, "Not authorized to accept this request");
    if (friendRecord.status !== "pending") throw createHttpError(400, "Friend request is no longer pending");

    const updatedFriend = await FriendModel.acceptRequest(friendId);
    res.status(200).json({ success: true, data: updatedFriend });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const rejectFriendRequest = async (req: RequestWithUser, res: Response) => {
  try {
    const friendId = req.params.friendId as string;
    const userId = req.user?.id;
    if (!userId) throw createHttpError(401, "Authentication required");

    const friendRecord = await FriendModel.getById(friendId);
    if (!friendRecord) throw createHttpError(404, "Friend request not found");
    if (friendRecord.addresseeId !== userId) throw createHttpError(403, "Not authorized to reject this request");

    const updatedFriend = await FriendModel.rejectRequest(friendId);
    res.status(200).json({ success: true, data: updatedFriend });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const cancelFriendRequest = async (req: RequestWithUser, res: Response) => {
  try {
    const friendId = req.params.friendId as string;
    const userId = req.user?.id;
    if (!userId) throw createHttpError(401, "Authentication required");

    const friendRecord = await FriendModel.getById(friendId);
    if (!friendRecord) throw createHttpError(404, "Friend request not found");
    if (friendRecord.requesterId !== userId) throw createHttpError(403, "Not authorized to cancel this request");

    await FriendModel.cancelRequest(friendId);
    res.status(200).json({ success: true, message: "Friend request cancelled" });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const blockUser = async (req: RequestWithUser, res: Response) => {
  try {
    const friendId = req.params.friendId as string;
    const userId = req.user?.id;
    if (!userId) throw createHttpError(401, "Authentication required");

    const friendRecord = await FriendModel.getById(friendId);
    if (!friendRecord) throw createHttpError(404, "Record not found");
    if (friendRecord.requesterId !== userId && friendRecord.addresseeId !== userId) {
      throw createHttpError(403, "Not authorized to block this user");
    }

    const updatedFriend = await FriendModel.blockUser(friendId);
    res.status(200).json({ success: true, data: updatedFriend });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const getFriends = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id;
    console.log('[friendController.getFriends] req.user:', req.user);
    if (!userId) throw createHttpError(401, "Authentication required");

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const friends = await FriendModel.getFriends(userId, limit, offset);
    console.log('[friendController.getFriends] raw friends result:', friends);

    const enrichedFriends = await Promise.all(
      friends.map(async (friend) => {
        const otherUserId = friend.requesterId === userId ? friend.addresseeId : friend.requesterId;
        console.log('[friendController.getFriends] friend record:', friend, 'otherUserId:', otherUserId);

        if (!otherUserId) {
          return { ...friend, profile: null };
        }

       const { data: profile, error } = await supabase
  .from("users")
  .select("*")
  .eq("id", otherUserId)
  .single();

console.log("OTHER USER ID:", otherUserId);
console.log("PROFILE:", profile);
console.log("PROFILE ERROR:", error);

        console.log('[friendController.getFriends] profile lookup:', { otherUserId, profile, error: error?.message ?? null });

        if (error) {
          return { ...friend, profile: null };
        }

        return { ...friend, profile };
      })
    );

    console.log('[friendController.getFriends] final response body count:', enrichedFriends.length);
    res.status(200).json({ success: true, data: enrichedFriends });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const removeFriend = async (req: RequestWithUser, res: Response) => {
  try {
    const friendId = req.params.friendId as string;
    const userId = req.user?.id;
    if (!userId) throw createHttpError(401, "Authentication required");

    const friendRecord = await FriendModel.getById(friendId);
    if (!friendRecord) throw createHttpError(404, "Friend record not found");
    if (friendRecord.requesterId !== userId && friendRecord.addresseeId !== userId) {
      throw createHttpError(403, "Not authorized to remove this friendship");
    }

    await FriendModel.delete(friendId);
    res.status(200).json({ success: true, message: "Friend removed" });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const checkFriendshipStatus = async (req: RequestWithUser, res: Response) => {
  try {
    const { userId } = req.query;
    const currentUserId = req.user?.id;
    if (!currentUserId) throw createHttpError(401, "Authentication required");
    if (!userId) throw createHttpError(400, "User ID is required");

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

export const getFriendRecord = async (req: RequestWithUser, res: Response) => {
  try {
    const friendId = req.params.friendId as string;
    const friendRecord = await FriendModel.getById(friendId);
    if (!friendRecord) throw createHttpError(404, "Friend record not found");
    res.status(200).json({ success: true, data: friendRecord });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};