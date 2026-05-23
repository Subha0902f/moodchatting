// server/src/models/channelModel.ts

import { supabaseAdmin as supabase } from "../config/supabase";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Channel {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateChannelPayload {
  name: string;
  description: string;
  memberIds?: string[];
}

export interface UpdateChannelPayload {
  name?: string;
  description?: string;
  memberIds?: string[];
}

// ─── Channel Model ────────────────────────────────────────────────────────────────

const ChannelModel = {

  // ── Create a new channel ──────────────────────────────────────────────────

  async create(payload: CreateChannelPayload): Promise<Channel> {
    const { data, error } = await supabase
      .from("channels")
      .insert([
        {
          name: payload.name,
          description: payload.description,
          member_ids: payload.memberIds || [],
        },
      ])
      .select()
      .single();

    if (error) throw new Error(`ChannelModel.create: ${error.message}`);
    
    // Transform snake_case to camelCase
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      memberIds: data.member_ids || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Channel;
  },

  // ── Get a single channel by ID ─────────────────────────────────────────────────

  async getById(channelId: string): Promise<Channel | null> {
    const { data, error } = await supabase
      .from("channels")
      .select("*")
      .eq("id", channelId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // not found
      throw new Error(`ChannelModel.getById: ${error.message}`);
    }

    // Transform snake_case to camelCase
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      memberIds: data.member_ids || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Channel;
  },

  // ── Get all channels ────────────────────────────────────────────────────────

  async getAll(limit = 20, offset = 0): Promise<Channel[]> {
    const { data, error } = await supabase
      .from("channels")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`ChannelModel.getAll: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((channel) => ({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      memberIds: channel.member_ids || [],
      createdAt: channel.created_at,
      updatedAt: channel.updated_at,
    })) as Channel[];
  },

  // ── Update a channel ──────────────────────────────────────────────────────

  async update(channelId: string, payload: UpdateChannelPayload): Promise<Channel> {
    const updateData: any = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.memberIds !== undefined) updateData.member_ids = payload.memberIds;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("channels")
      .update(updateData)
      .eq("id", channelId)
      .select()
      .single();

    if (error) throw new Error(`ChannelModel.update: ${error.message}`);

    // Transform snake_case to camelCase
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      memberIds: data.member_ids || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Channel;
  },

  // ── Delete a channel ──────────────────────────────────────────────────────

  async delete(channelId: string): Promise<void> {
    const { error } = await supabase
      .from("channels")
      .delete()
      .eq("id", channelId);

    if (error) throw new Error(`ChannelModel.delete: ${error.message}`);
  },

  // ── Add a member to a channel ─────────────────────────────────────────────

  async addMember(channelId: string, userId: string): Promise<Channel> {
    // Get current channel
    const currentChannel = await this.getById(channelId);
    if (!currentChannel) {
      throw new Error("Channel not found");
    }

    // Add member if not already present
    const memberIds = currentChannel.memberIds.includes(userId)
      ? currentChannel.memberIds
      : [...currentChannel.memberIds, userId];

    return this.update(channelId, { memberIds });
  },

  // ── Remove a member from a channel ────────────────────────────────────────

  async removeMember(channelId: string, userId: string): Promise<Channel> {
    // Get current channel
    const currentChannel = await this.getById(channelId);
    if (!currentChannel) {
      throw new Error("Channel not found");
    }

    // Remove member
    const memberIds = currentChannel.memberIds.filter((id) => id !== userId);
    return this.update(channelId, { memberIds });
  },

  // ── Get channels by user ID ───────────────────────────────────────────────

  async getByUser(userId: string): Promise<Channel[]> {
    const { data, error } = await supabase
      .from("channels")
      .select("*")
      .contains("member_ids", [userId])
      .order("created_at", { ascending: false });

    if (error) throw new Error(`ChannelModel.getByUser: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((channel) => ({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      memberIds: channel.member_ids || [],
      createdAt: channel.created_at,
      updatedAt: channel.updated_at,
    })) as Channel[];
  },
};

export default ChannelModel;