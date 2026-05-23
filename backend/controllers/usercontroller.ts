import { createCrudController, createHttpError, sendRouteError } from "../routes/routeUtils";

export const userController = createCrudController("User", [
  {
    id: "me",
    username: "demo",
    email: "demo@moodchat.local",
    name: "Demo User",
    avatarUrl: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]);

export const getMe = async (_req: any, res: any) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        id: "me",
        username: "demo",
        email: "demo@moodchat.local",
        name: "Demo User",
        avatarUrl: "",
      },
    });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};

export const updateMe = async (req: any, res: any) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw createHttpError(400, "Profile update payload is required");
    }

    return res.status(200).json({
      success: true,
      data: {
        id: "me",
        ...req.body,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};
