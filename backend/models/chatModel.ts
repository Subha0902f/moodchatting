// server/src/models/chatModel.ts

import { supabaseAdmin as supabase } from "../config/supabase";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ChatType = "private" | "group";

export interface Chat {
  id: string;
  participants: string[];
  type: ChatType;
  name: string | null;
  lastMessageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatPayload {
  participants: string[];
  type: ChatType;
  name?: string;
  lastMessageId?: string;
}

export interface UpdateChatPayload {
  participants?: string[];
  type?: ChatType;
  name?: string;
  lastMessageId?: string;
}

// ─── Chat Model ────────────────────────────────────────────────────────────────

const ChatModel = {

  // ── Create a new chat ──────────────────────────────────────────────────

  async create(payload: CreateChatPayload): Promise<Chat> {
    const { data, error } = await supabase
      .from("chats")
      .insert([
        {
          participants: payload.participants,
          type: payload.type,
          name: payload.name || null,
          last_message_id: payload.lastMessageId || null,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(`ChatModel.create: ${error.message}`);

    // Transform snake_case to camelCase
    return {
      id: data.id,
      participants: data.participants,
      type: data.type,
      name: data.name,
      lastMessageId: data.last_message_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Chat;
  },

  // ── Get a single chat by ID ─────────────────────────────────────────────────

  async getById(chatId: string): Promise<Chat | null> {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("id", chatId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // not found
      throw new Error(`ChatModel.getById: ${error.message}`);
    }

    // Transform snake_case to camelCase
    return {
      id: data.id,
      participants: data.participants,
      type: data.type,
      name: data.name,
      lastMessageId: data.last_message_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Chat;
  },

  // ── Get all chats ────────────────────────────────────────────────────────

  async getAll(limit = 20, offset = 0): Promise<Chat[]> {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`ChatModel.getAll: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((chat) => ({
      id: chat.id,
      participants: chat.participants,
      type: chat.type,
      name: chat.name,
      lastMessageId: chat.last_message_id,
      createdAt: chat.created_at,
      updatedAt: chat.updated_at,
    })) as Chat[];
  },

  // ── Get chat by participants (for private chats) ─────────────────────────

  async getByParticipants(participantIds: string[]): Promise<Chat | null> {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("type", "private")
      .contains("participants", participantIds)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // not found
      throw new Error(`ChatModel.getByParticipants: ${error.message}`);
    }

    // Transform snake_case to camelCase
    return {
      id: data.id,
      participants: data.participants,
      type: data.type,
      name: data.name,
      lastMessageId: data.last_message_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Chat;
  },

  // ── Get chats by user ID ────────────────────────────────────────────────

  async getByUser(userId: string): Promise<Chat[]> {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .contains("participants", [userId])
      .order("updated_at", { ascending: false });

    if (error) throw new Error(`ChatModel.getByUser: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((chat) => ({
      id: chat.id,
      participants: chat.participants,
      type: chat.type,
      name: chat.name,
      lastMessageId: chat.last_message_id,
      createdAt: chat.created_at,
      updatedAt: chat.updated_at,
    })) as Chat[];
  },

  // ── Update a chat ──────────────────────────────────────────────────────

  async update(chatId: string, payload: UpdateChatPayload): Promise<Chat> {
    const updateData: any = {};
    if (payload.participants !== undefined) updateData.participants = payload.participants;
    if (payload.type !== undefined) updateData.type = payload.type;
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.lastMessageId !== undefined) updateData.last_message_id = payload.lastMessageId;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("chats")
      .update(updateData)
      .eq("id", chatId)
      .select()
      .single();

    if (error) throw new Error(`ChatModel.update: ${error.message}`);

    // Transform snake_case to camelCase
    return {
      id: data.id,
      participants: data.participants,
      type: data.type,
      name: data.name,
      lastMessageId: data.last_message_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Chat;
  },

  // ── Delete a chat ──────────────────────────────────────────────────────

  async delete(chatId: string): Promise<void> {
    const { error } = await supabase
      .from("chats")
      .delete()
      .eq("id", chatId);

    if (error) throw new Error(`ChatModel.delete: ${error.message}`);
  },

  // ── Add a participant to a chat ─────────────────────────────────────────

  async addParticipant(chatId: string, userId: string): Promise<Chat> {
    // Get current chat
    const currentChat = await this.getById(chatId);
    if (!currentChat) {
      throw new Error("Chat not found");
    }

    // Add participant if not already present
    const participants = currentChat.participants.includes(userId)
      ? currentChat.participants
      : [...currentChat.participants, userId];

    return this.update(chatId, { participants });
  },

  // ── Remove a participant from a chat ────────────────────────────────────

  async removeParticipant(chatId: string, userId: string): Promise<Chat> {
    // Get current chat
    const currentChat = await this.getById(chatId);
    if (!currentChat) {
      throw new Error("Chat not found");
    }

    // Remove participant
    const participants = currentChat.participants.filter((id) => id !== userId);
    return this.update(chatId, { participants });
  },

  // ── Update last message ─────────────────────────────────────────────────

  async updateLastMessage(chatId: string, messageId: string): Promise<Chat> {
    return this.update(chatId, { lastMessageId: messageId });
  },
};

export default ChatModel;