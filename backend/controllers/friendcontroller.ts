import { createHttpError, sendRouteError } from "../routes/routeUtils";

const friends: any[] = [];

export const listFriends = async (_req: any, res: any) => {
  try {
    return res.status(200).json({ success: true, data: friends });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};

export const addFriend = async (req: any, res: any) => {
  try {
    const { userId = "me", friendId } = req.body || {};

    if (!friendId) {
      throw createHttpError(400, "friendId is required");
    }

    const friendship = {
      id: `${userId}:${friendId}`,
      userId,
      friendId,
      status: "accepted",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    friends.push(friendship);

    return res.status(201).json({ success: true, data: friendship });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};

export const createFriendRequest = async (req: any, res: any) => {
  try {
    const { userId = "me", friendId } = req.body || {};

    if (!friendId) {
      throw createHttpError(400, "friendId is required");
    }

    const request = {
      id: `${userId}:${friendId}`,
      userId,
      friendId,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    friends.push(request);

    return res.status(201).json({ success: true, data: request });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};

export const updateFriendship = async (req: any, res: any) => {
  try {
    const index = friends.findIndex((friendship) => String(friendship.friendId) === req.params.friendId);

    if (index === -1) {
      throw createHttpError(404, "Friendship not found");
    }

    friends[index] = {
      ...friends[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    return res.status(200).json({ success: true, data: friends[index] });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};

export const removeFriend = async (req: any, res: any) => {
  try {
    const index = friends.findIndex((friendship) => String(friendship.friendId) === req.params.friendId);

    if (index === -1) {
      throw createHttpError(404, "Friendship not found");
    }

    const [deletedFriendship] = friends.splice(index, 1);

    return res.status(200).json({ success: true, data: deletedFriendship });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};
