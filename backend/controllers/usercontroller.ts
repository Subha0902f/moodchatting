import { createHttpError, sendRouteError } from "../routes/routeUtils";
import { createCrudController } from "./createCrudController";
import { supabaseAdmin as supabase } from "../config/supabase";

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

export const getMe = async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw createHttpError(401, "Authentication required");
    }

    // Fetch user profile from Supabase
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw createHttpError(500, `Failed to fetch profile: ${error.message}`);
    }

    return res.status(200).json({
      success: true,
      data: profile || {
        id: userId,
        username: req.user?.email?.split("@")[0] || "user",
        email: req.user?.email || "",
        full_name: req.user?.user_metadata?.full_name || "",
        bio: "",
        about: "",
        profile_picture_url: null,
        phone: "",
        hashtags: [],
      },
    });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};

export const updateMe = async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw createHttpError(401, "Authentication required");
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      throw createHttpError(400, "Profile update payload is required");
    }

    // Map camelCase to snake_case for database
    const updateData: any = {};
    const { name, email, username, profilePictureUrl, bio, about, phone, hashtags } = req.body;

    if (name !== undefined) updateData.full_name = name;
    if (email !== undefined) updateData.email = email;
    if (username !== undefined) updateData.username = username;
    if (profilePictureUrl !== undefined) updateData.profile_picture_url = profilePictureUrl;
    if (bio !== undefined) updateData.bio = bio;
    if (about !== undefined) updateData.about = about;
    if (phone !== undefined) updateData.phone = phone;
    if (hashtags !== undefined) updateData.hashtags = hashtags;

    // Update user profile in Supabase
    const { data: updated, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw createHttpError(500, `Failed to update profile: ${error.message}`);
    }

    // Keep the user avatar in sync with the shared users table so
    // socket and auth-aware components can reflect the latest image.
    if (profilePictureUrl !== undefined) {
      const { error: userError } = await supabase
        .from("users")
        .update({ avatar_url: profilePictureUrl })
        .eq("id", userId);

      if (userError) {
        throw createHttpError(500, `Failed to sync user avatar: ${userError.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};
