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
    const { data, error } = await supabase
      .from("friends")
      .insert([
        {
          user_id: payload.requesterId,
          friend_id: payload.addresseeId,
          status: payload.status || "pending",
        },
      ])
      .select()
      .single();

    if (error) throw new Error(`FriendModel.create: ${error.message}`);

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
      .or(`and(user_id.eq.${userId},status.eq.accepted),and(friend_id.eq.${userId},status.eq.accepted)`)
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`FriendModel.getFriends: ${error.message}`);

    return ((data ?? []) as any[]).map((friend) => ({
      id: friend.id,
      requesterId: friend.user_id,
      addresseeId: friend.friend_id,
      status: friend.status,
      createdAt: friend.created_at,
      updatedAt: friend.updated_at,
    })) as Friend[];
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
      .eq("friend_id", userId)
      .eq("status", "pending");

    if (error) throw new Error(`FriendModel.getPendingRequests: ${error.message}`);

    return ((data ?? []) as any[]).map((friend) => ({
      id: friend.id,
      requesterId: friend.user_id,
      addresseeId: friend.friend_id,
      status: friend.status,
      createdAt: friend.created_at,
      updatedAt: friend.updated_at,
    })) as Friend[];
  },

  // ── Get sent friend requests by a user ────────────────────────────────────

  async getSentRequests(userId: string): Promise<Friend[]> {
    const { data, error } = await supabase
      .from("friends")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending");

    if (error) throw new Error(`FriendModel.getSentRequests: ${error.message}`);

    return ((data ?? []) as any[]).map((friend) => ({
      id: friend.id,
      requesterId: friend.user_id,
      addresseeId: friend.friend_id,
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

  async delete(friendId: string): Promise<void> {
    const { error } = await supabase
      .from("friends")
      .delete()
      .eq("id", friendId);

    if (error) throw new Error(`FriendModel.delete: ${error.message}`);
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
        .eq("user_id", requesterId)
        .eq("friend_id", addresseeId)
      .eq("status", "pending")
      .single();

    if (error) {
      if (error.code === "PGRST116") return false;
      throw new Error(`FriendModel.hasPendingRequest: ${error.message}`);
    }

    return data !== null;
  },
};

export default FriendModel;