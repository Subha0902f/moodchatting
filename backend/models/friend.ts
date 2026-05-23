// server/src/models/friend.ts

import { supabaseAdmin as supabase } from "../config/supabase";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type FriendStatus = "pending" | "accepted" | "blocked" | "rejected";

export interface Friend {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateFriendPayload {
  requester_id: string;
  addressee_id: string;
  status?: FriendStatus;
}

export interface UpdateFriendPayload {
  status?: FriendStatus;
}

export interface FriendWithUsers extends Friend {
  requester: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  addressee: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

// ─── Friend Model ───────────────────────────────────────────────────────────────

const FriendModel = {

  // ── Create a new friend request ──────────────────────────────────────────

  async create(payload: CreateFriendPayload): Promise<Friend> {
    const { data, error } = await supabase
      .from("friends")
      .insert([
        {
          requester_id: payload.requester_id,
          addressee_id: payload.addressee_id,
          status: payload.status || "pending",
        },
      ])
      .select()
      .single();

    if (error) throw new Error(`FriendModel.create: ${error.message}`);

    return data as Friend;
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

    return data as Friend;
  },

  // ── Get friend record with user details ───────────────────────────────────

  async getByIdWithUsers(friendId: string): Promise<FriendWithUsers | null> {
    const { data, error } = await supabase
      .from("friends")
      .select(`
        *,
        requester:users!requester_id (
          id,
          username,
          avatar_url
        ),
        addressee:users!addressee_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq("id", friendId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // not found
      throw new Error(`FriendModel.getByIdWithUsers: ${error.message}`);
    }

    return data as FriendWithUsers;
  },

  // ── Get friend request between two users ──────────────────────────────────

  async getBetweenUsers(userId1: string, userId2: string): Promise<Friend | null> {
    const { data, error } = await supabase
      .from("friends")
      .select("*")
      .or(`and(requester_id.eq.${userId1},addressee_id.eq.${userId2}),and(requester_id.eq.${userId2},addressee_id.eq.${userId1})`)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // not found
      throw new Error(`FriendModel.getBetweenUsers: ${error.message}`);
    }

    return data as Friend;
  },

  // ── Get all friends for a user (accepted requests only) ───────────────────

  async getFriends(userId: string, limit = 50, offset = 0): Promise<Friend[]> {
    const { data, error } = await supabase
      .from("friends")
      .select("*")
      .or(`and(requester_id.eq.${userId},status.eq.accepted),and(addressee_id.eq.${userId},status.eq.accepted)`)
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`FriendModel.getFriends: ${error.message}`);

    return (data ?? []) as Friend[];
  },

  // ── Get friends with user details ─────────────────────────────────────────

  async getFriendsWithDetails(userId: string, limit = 50, offset = 0): Promise<FriendWithUsers[]> {
    const { data, error } = await supabase
      .from("friends")
      .select(`
        *,
        requester:users!requester_id (
          id,
          username,
          avatar_url
        ),
        addressee:users!addressee_id (
          id,
          username,
          avatar_url
        )
      `)
      .or(`and(requester_id.eq.${userId},status.eq.accepted),and(addressee_id.eq.${userId},status.eq.accepted)`)
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`FriendModel.getFriendsWithDetails: ${error.message}`);

    return (data ?? []) as FriendWithUsers[];
  },

  // ── Get pending friend requests for a user ────────────────────────────────

  async getPendingRequests(userId: string): Promise<Friend[]> {
    const { data, error } = await supabase
      .from("friends")
      .select("*")
      .eq("addressee_id", userId)
      .eq("status", "pending");

    if (error) throw new Error(`FriendModel.getPendingRequests: ${error.message}`);

    return (data ?? []) as Friend[];
  },

  // ── Get sent friend requests by a user ────────────────────────────────────

  async getSentRequests(userId: string): Promise<Friend[]> {
    const { data, error } = await supabase
      .from("friends")
      .select("*")
      .eq("requester_id", userId)
      .eq("status", "pending");

    if (error) throw new Error(`FriendModel.getSentRequests: ${error.message}`);

    return (data ?? []) as Friend[];
  },

  // ── Update a friend record ────────────────────────────────────────────────

  async update(friendId: string, payload: UpdateFriendPayload): Promise<Friend> {
    const updateData: any = {};
    if (payload.status !== undefined) updateData.status = payload.status;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("friends")
      .update(updateData)
      .eq("id", friendId)
      .select()
      .single();

    if (error) throw new Error(`FriendModel.update: ${error.message}`);

    return data as Friend;
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
      .eq("requester_id", requesterId)
      .eq("addressee_id", addresseeId)
      .eq("status", "pending")
      .single();

    if (error) {
      if (error.code === "PGRST116") return false;
      throw new Error(`FriendModel.hasPendingRequest: ${error.message}`);
    }

    return data !== null;
  },

  // ── Get friend count for a user ───────────────────────────────────────────

  async getFriendCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("friends")
      .select("*", { count: "exact", head: true })
      .or(`and(requester_id.eq.${userId},status.eq.accepted),and(addressee_id.eq.${userId},status.eq.accepted)`);

    if (error) throw new Error(`FriendModel.getFriendCount: ${error.message}`);

    return count || 0;
  },

  // ── Get pending request count for a user ──────────────────────────────────

  async getPendingRequestCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("friends")
      .select("*", { count: "exact", head: true })
      .eq("addressee_id", userId)
      .eq("status", "pending");

    if (error) throw new Error(`FriendModel.getPendingRequestCount: ${error.message}`);

    return count || 0;
  },
};

export default FriendModel;