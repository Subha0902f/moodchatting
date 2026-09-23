// server/src/models/friendModel.ts

import { supabaseAdmin as supabase } from "../config/supabase";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type FriendStatus = "pending" | "accepted" | "blocked" | "rejected";

export interface Friend {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFriendPayload {
  requesterId: string;
  addresseeId: string;
  status?: FriendStatus;
}

export interface UpdateFriendPayload {
  status?: FriendStatus;
}

// ─── Friend Model ───────────────────────────────────────────────────────────────

const FriendModel = {

  // ── Create a new friend request ──────────────────────────────────────────

  async create(payload: CreateFriendPayload): Promise<Friend> {
    const insertPayload: Record<string, any> = {
      status: payload.status || "pending",
    };

    insertPayload.user_id = payload.requesterId;
    insertPayload.friend_id = payload.addresseeId;
    insertPayload.requester_id = payload.requesterId;
    insertPayload.addressee_id = payload.addresseeId;

    const { data, error } = await supabase
      .from("friends")
      .insert([insertPayload])
      .select()
      .single();

    if (error) throw new Error(`FriendModel.create: ${error.message}`);

    const rowUserId = data.user_id ?? data.requester_id ?? payload.requesterId;
    const rowFriendId = data.friend_id ?? data.addressee_id ?? payload.addresseeId;

    return {
      id: data.id,
      requesterId: rowUserId,
      addresseeId: rowFriendId,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Friend;
  },

  // ── Get a single friend record by ID ──────────────────────────────────────

  async getById(friendId: string): Promise<Friend | null> {
    const { data, error } = await supabase
      .from("friends")
      .select("*")
      .eq("id", friendId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // not found
      throw new Error(`FriendModel.getById: ${error.message}`);
    }

    // Transform snake_case to camelCase
    return {
      id: data.id,
      requesterId: data.user_id,
      addresseeId: data.friend_id,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Friend;
  },

  // ── Get friend request between two users ──────────────────────────────────

  async getBetweenUsers(userId1: string, userId2: string): Promise<Friend | null> {
    const { data, error } = await supabase
      .from("friends")
      .select("*")
      .or(`and(user_id.eq.${userId1},friend_id.eq.${userId2}),and(user_id.eq.${userId2},friend_id.eq.${userId1})`)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // not found
      throw new Error(`FriendModel.getBetweenUsers: ${error.message}`);
    }

    return {
      id: data.id,
      requesterId: data.user_id,
      addresseeId: data.friend_id,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Friend;
  },

  // ── Get all friends for a user (accepted requests only) ───────────────────

  async getFriends(userId: string, limit = 50, offset = 0): Promise<Friend[]> {
    const { data, error } = await supabase
      .from("friends")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(`FriendModel.getFriends: ${error.message}`);

    const rows = ((data ?? []) as any[])
      .filter((friend) => {
        const rowUserId = friend.user_id ?? friend.requester_id;
        const rowFriendId = friend.friend_id ?? friend.addressee_id;
        if (!rowUserId || !rowFriendId) return false;
        if (friend.status !== "accepted") return false;
        if (rowUserId === userId || rowFriendId === userId) return true;
        return false;
      })
      .map((friend) => {
        const rowUserId = friend.user_id ?? friend.requester_id;
        const rowFriendId = friend.friend_id ?? friend.addressee_id;
        return {
          id: friend.id,
          requesterId: rowUserId,
          addresseeId: rowFriendId,
          status: friend.status,
          createdAt: friend.created_at,
          updatedAt: friend.updated_at,
        };
      }) as Friend[];

    const seen = new Set<string>();
    const deduped = rows.filter((friend) => {
      const otherUserId = friend.requesterId === userId ? friend.addresseeId : friend.requesterId;
      if (!otherUserId || seen.has(otherUserId)) return false;
      seen.add(otherUserId);
      return true;
    });

    return deduped.slice(offset, offset + limit);
  },

  async getFriendsWithDetails(userId: string, limit = 50, offset = 0): Promise<(Friend & {
    requester: { id: string; username: string | null; email: string | null; avatar_url: string | null; full_name: string | null };
    addressee: { id: string; username: string | null; email: string | null; avatar_url: string | null; full_name: string | null };
  })[]> {
    const { data, error } = await supabase
      .from("friends")
      .select(`
        *,
        requester:users!user_id (
          id,
          username,
          email,
          avatar_url,
          full_name
        ),
        addressee:users!friend_id (
          id,
          username,
          email,
          avatar_url,
          full_name
        )
      `)
      .or(`and(user_id.eq.${userId},status.eq.accepted),and(friend_id.eq.${userId},status.eq.accepted)`)
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`FriendModel.getFriendsWithDetails: ${error.message}`);

    return (data ?? []) as any[];
  },

  async getPendingRequests(userId: string): Promise<Friend[]> {
    const { data, error } = await supabase
      .from("friends")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw new Error(`FriendModel.getPendingRequests: ${error.message}`);

    const rows = ((data ?? []) as any[])
      .filter((friend) => {
        const rowUserId = friend.user_id ?? friend.requester_id;
        const rowFriendId = friend.friend_id ?? friend.addressee_id;
        if (!rowUserId || !rowFriendId) return false;
        if (rowUserId === userId && rowFriendId !== userId) return false;
        if (rowFriendId === userId && rowUserId !== userId) return true;
        return false;
      })
      .map((friend) => ({
        id: friend.id,
        requesterId: friend.user_id ?? friend.requester_id,
        addresseeId: friend.friend_id ?? friend.addressee_id,
        status: friend.status,
        createdAt: friend.created_at,
        updatedAt: friend.updated_at,
      })) as Friend[];

    const seen = new Set<string>();
    return rows.filter((friend) => {
      const senderId = friend.requesterId;
      if (!senderId || seen.has(senderId)) return false;
      seen.add(senderId);
      return true;
    });
  },

  // ── Get sent friend requests by a user ────────────────────────────────────

  async getSentRequests(userId: string): Promise<Friend[]> {
    const { data, error } = await supabase
      .from("friends")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw new Error(`FriendModel.getSentRequests: ${error.message}`);

    return ((data ?? []) as any[])
      .filter((friend) => {
        const rowUserId = friend.user_id ?? friend.requester_id;
        const rowFriendId = friend.friend_id ?? friend.addressee_id;
        if (!rowUserId || !rowFriendId) return false;
        return rowUserId === userId && rowFriendId !== userId;
      })
      .map((friend) => ({
        id: friend.id,
        requesterId: friend.user_id ?? friend.requester_id,
        addresseeId: friend.friend_id ?? friend.addressee_id,
        status: friend.status,
        createdAt: friend.created_at,
        updatedAt: friend.updated_at,
      })) as Friend[];
  },

  // ── Update a friend record ────────────────────────────────────────────────

  async update(friendId: string, payload: UpdateFriendPayload): Promise<Friend> {
    const updateData: any = {};
    if (payload.status !== undefined) updateData.status = payload.status;
    

    const { data, error } = await supabase
      .from("friends")
      .update(updateData)
      .eq("id", friendId)
      .select()
      .single();

    if (error) throw new Error(`FriendModel.update: ${error.message}`);

    return {
      id: data.id,
      requesterId: data.user_id,
      addresseeId: data.friend_id,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Friend;
  },

  // ── Accept a friend request ───────────────────────────────────────────────

  async acceptRequest(friendId: string): Promise<Friend> {
    const friend = await this.getById(friendId);
    if (!friend) {
      throw new Error("FriendModel.acceptRequest: friend record not found");
    }

    const { data: relatedRows, error: relatedError } = await supabase
      .from("friends")
      .select("id")
      .or(`and(user_id.eq.${friend.requesterId},friend_id.eq.${friend.addresseeId}),and(user_id.eq.${friend.addresseeId},friend_id.eq.${friend.requesterId}),and(requester_id.eq.${friend.requesterId},addressee_id.eq.${friend.addresseeId}),and(requester_id.eq.${friend.addresseeId},addressee_id.eq.${friend.requesterId})`)
      .in("status", ["pending", "accepted"]);

    if (relatedError) throw new Error(`FriendModel.acceptRequest: ${relatedError.message}`);

    const idsToUpdate = (relatedRows ?? []).map((row: any) => row.id);
    if (idsToUpdate.length > 0) {
      const { error: updateError } = await supabase
        .from("friends")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .in("id", idsToUpdate);

      if (updateError) throw new Error(`FriendModel.acceptRequest: ${updateError.message}`);
    }

    return this.update(friendId, { status: "accepted" });
  },

  // ── Reject a friend request ───────────────────────────────────────────────

  async rejectRequest(friendId: string): Promise<Friend> {
    return this.update(friendId, { status: "rejected" });
  },

  // ── Block a user ──────────────────────────────────────────────────────────

  async blockUser(friendId: string): Promise<Friend> {
    return this.update(friendId, { status: "blocked" });
  },

  // ── Cancel a pending friend request ───────────────────────────────────────

  async cancelRequest(friendId: string): Promise<void> {
    const { error } = await supabase
      .from("friends")
      .delete()
      .eq("id", friendId);

    if (error) throw new Error(`FriendModel.cancelRequest: ${error.message}`);
  },

  // ── Delete a friend record ────────────────────────────────────────────────

  async delete(friendId: string): Promise<any[]> {
  console.log("[FriendModel.delete] deleting friendship:", friendId);

  const { data, error } = await supabase
    .from("friends")
    .delete()
    .eq("id", friendId)
    .select();

  console.log("[FriendModel.delete] deleted rows:", data);
  console.log("[FriendModel.delete] error:", error);

  if (error) {
    throw new Error(`FriendModel.delete: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("No friendship row was deleted");
  }

  return data as any[];
},

  // ── Check if two users are friends ────────────────────────────────────────

  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const friend = await this.getBetweenUsers(userId1, userId2);
    return friend !== null && friend.status === "accepted";
  },

  // ── Check if a pending request exists ─────────────────────────────────────

  async hasPendingRequest(requesterId: string, addresseeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("friends")
      .select("id")
      .or(`and(user_id.eq.${requesterId},friend_id.eq.${addresseeId}),and(user_id.eq.${addresseeId},friend_id.eq.${requesterId}),and(requester_id.eq.${requesterId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${requesterId})`)
      .eq("status", "pending")
      .limit(1);

    if (error) {
      throw new Error(`FriendModel.hasPendingRequest: ${error.message}`);
    }

    return (data ?? []).length > 0;
  },
};

export default FriendModel;