import { supabase } from "./supabaseclient";


export const getProfile = (userId: string) => {
  return supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
};

export const updateProfile = (userId: string, data: any) => {
  return supabase
    .from("users")
    .update(data)
    .eq("id", userId);
};

const getInitials = (nameOrEmail: string) => {
  const cleaned = nameOrEmail?.trim() || "";
  if (!cleaned) return "MC";
  const base = cleaned.includes("@") ? cleaned.split("@")[0] : cleaned;
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "MC";
};
console.log("getFriendsForUser CALLED");
export const getFriendsForUser = async (userId: string, limit = 50, offset = 0) => {
  try {
    const response = await supabase
      .from("friends")
      .select("*")
.or(`and(user_id.eq.${userId},status.eq.accepted),and(friend_id.eq.${userId},status.eq.accepted)`)
      
      .range(offset, offset + limit - 1);

    if (response.error) throw new Error(response.error.message);

    // Transform the response to include friend details
const friends = await Promise.all(
  (response.data || []).map(async (friendship: any) => {
    const otherUserId =
  friendship.requesterId === userId
    ? friendship.addresseeId
    : friendship.requesterId;
    console.log("USER:", userId);
console.log("OTHER USER:", otherUserId);
console.log("CURRENT USER:", userId);
console.log("FRIENDSHIP:", friendship);
console.log("OTHER USER:", otherUserId);
    const { data: profile } = await supabase
      .from("users")
      .select("id, username, email")
      .eq("id", otherUserId)
      .single();
console.log("OTHER USER ID:", otherUserId);
console.log("PROFILE:", profile);
    return {
      id: otherUserId,
      name: profile?.username || "Unknown",
      initials: getInitials(profile?.username || "Unknown"),
      active: false,
      online: false,
    };
  })
);

    return friends;
  } catch (error) {
    console.error("Failed to fetch friends:", error);
    return [];
  }
};

