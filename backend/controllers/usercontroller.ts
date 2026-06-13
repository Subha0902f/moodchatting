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

export const getUser = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("users")
      .select(`id, email, username, bio, profile_picture_url`)
      .eq("id", id)
      .single();

    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};
 
export const getMe = async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw createHttpError(401, "Authentication required");
    }

    // Fetch user profile from Supabase
    const { data: profile, error } = await supabase
      .from("users")
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
      .from("users")
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
export const searchUsers = async (req: any, res: any) => {
  try {
    const currentUserId = req.user?.id;
    const query = (req.query.name as string)?.trim();

    if (!query || query.length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }

    const { data, error: queryError } = await supabase
      .from("users")
     .select(`id, email, username, bio, profile_picture_url`)
.or(`email.ilike.%${query}%,username.ilike.%${query}%`)
      .neq("id", currentUserId)
      .limit(10);

    if (queryError) throw queryError;

    const normalized = (data ?? []).map((u: any) => ({
      id: u.id,
      username: u.username || u["Email id"],
      full_name: u.username || u["Email id"],
      avatar_url: u.profile_picture_url,
      bio: u.bio,
    }));

    return res.status(200).json({ success: true, data: normalized });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};