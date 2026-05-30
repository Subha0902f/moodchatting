import { supabase } from "./supabaseclient";
import { UserAPI } from "./api";

export const getProfile = (userId: string) => {
  return supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
};

export const updateProfile = (userId: string, data: any) => {
  return supabase
    .from("profiles")
    .update(data)
    .eq("id", userId);
};

export const getFriendsForUser = async (userId: string, limit = 50, offset = 0) => {
  try {
    const response = await supabase
      .from("friends")
      .select(`
        id,
        requester_id,
        addressee_id,
        status,
        created_at,
        updated_at,
        requester:profiles!requester_id(id, full_name, username, profile_picture_url),
        addressee:profiles!addressee_id(id, full_name, username, profile_picture_url)
      `)
      .or(`and(requester_id.eq.${userId},status.eq.accepted),and(addressee_id.eq.${userId},status.eq.accepted)`)
      .range(offset, offset + limit - 1);

    if (response.error) throw new Error(response.error.message);

    // Transform the response to include friend details
    const friends = response.data?.map((friendship: any) => {
      const friendProfile = friendship.requester_id === userId ? friendship.addressee : friendship.requester;
      return {
        id: friendProfile.id,
        name: friendProfile.full_name || friendProfile.username,
        initials: getInitials(friendProfile.full_name || friendProfile.username),
        profilePictureUrl: friendProfile.profile_picture_url,
        online: false, // This would need a real-time subscription to determine
        active: false,
      };
    }) || [];

    return friends;
  } catch (error) {
    console.error("Failed to fetch friends:", error);
    return [];
  }
};

const getInitials = (nameOrEmail: string) => {
  const cleaned = nameOrEmail?.trim() || "";
  if (!cleaned) return "MC";
  const base = cleaned.includes("@") ? cleaned.split("@")[0] : cleaned;
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "MC";
};