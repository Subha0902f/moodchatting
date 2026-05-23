// backend/models/Message.ts

import { supabaseAdmin as supabase } from "../config/supabase";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type MessageType = "text" | "image" | "video" | "file";

export interface Message {
  id: string;
  chat: string;
  sender: string;
  content: string;
  type: MessageType;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessagePayload {
  chat: string;
  sender: string;
  content: string;
  type?: MessageType;
  readBy?: string[];
}

export interface UpdateMessagePayload {
  content?: string;
  type?: MessageType;
  readBy?: string[];
}

// ─── Message Model ────────────────────────────────────────────────────────────────

const MessageModel = {

  // ── Create a new message ──────────────────────────────────────────────────

  async create(payload: CreateMessagePayload): Promise<Message> {
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          chat: payload.chat,
          sender: payload.sender,
          content: payload.content,
          type: payload.type || "text",
          read_by: payload.readBy || [],
        },
      ])
      .select()
      .single();

    if (error) throw new Error(`MessageModel.create: ${error.message}`);

    // Transform snake_case to camelCase
    return {
      id: data.id,
      chat: data.chat,
      sender: data.sender,
      content: data.content,
      type: data.type,
      readBy: data.read_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Message;
  },

  // ── Get a single message by ID ─────────────────────────────────────────────────

  async getById(messageId: string): Promise<Message | null> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("id", messageId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // not found
      throw new Error(`MessageModel.getById: ${error.message}`);
    }

    // Transform snake_case to camelCase
    return {
      id: data.id,
      chat: data.chat,
      sender: data.sender,
      content: data.content,
      type: data.type,
      readBy: data.read_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Message;
  },

  // ── Get all messages for a chat ────────────────────────────────────────────────

  async getByChat(chatId: string, limit = 50, offset = 0): Promise<Message[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat", chatId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`MessageModel.getByChat: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((message) => ({
      id: message.id,
      chat: message.chat,
      sender: message.sender,
      content: message.content,
      type: message.type,
      readBy: message.read_by,
      createdAt: message.created_at,
      updatedAt: message.updated_at,
    })) as Message[];
  },

  // ── Get messages by sender ─────────────────────────────────────────────────────

  async getBySender(senderId: string, limit = 20, offset = 0): Promise<Message[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("sender", senderId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`MessageModel.getBySender: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((message) => ({
      id: message.id,
      chat: message.chat,
      sender: message.sender,
      content: message.content,
      type: message.type,
      readBy: message.read_by,
      createdAt: message.created_at,
      updatedAt: message.updated_at,
    })) as Message[];
  },

  // ── Update a message ──────────────────────────────────────────────────────

  async update(messageId: string, payload: UpdateMessagePayload): Promise<Message> {
    const updateData: any = {};
    if (payload.content !== undefined) updateData.content = payload.content;
    if (payload.type !== undefined) updateData.type = payload.type;
    if (payload.readBy !== undefined) updateData.read_by = payload.readBy;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("messages")
      .update(updateData)
      .eq("id", messageId)
      .select()
      .single();

    if (error) throw new Error(`MessageModel.update: ${error.message}`);

    // Transform snake_case to camelCase
    return {
      id: data.id,
      chat: data.chat,
      sender: data.sender,
      content: data.content,
      type: data.type,
      readBy: data.read_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Message;
  },

  // ── Delete a message ──────────────────────────────────────────────────────

  async delete(messageId: string): Promise<void> {
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId);

    if (error) throw new Error(`MessageModel.delete: ${error.message}`);
  },

  // ── Mark message as read by user ──────────────────────────────────────────

  async markAsRead(messageId: string, userId: string): Promise<Message> {
    // Get current message
    const currentMessage = await this.getById(messageId);
    if (!currentMessage) {
      throw new Error("Message not found");
    }

    // Add user to readBy if not already present
    const readBy = currentMessage.readBy.includes(userId)
      ? currentMessage.readBy
      : [...currentMessage.readBy, userId];

    return this.update(messageId, { readBy });
  },

  // ── Get unread messages count for a user in a chat ────────────────────────

  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    const { data, error } = await supabase
      .from("messages")
      .select("id, read_by")
      .eq("chat", chatId)
      .neq("sender", userId);

    if (error) throw new Error(`MessageModel.getUnreadCount: ${error.message}`);

    // Count messages where user is not in readBy
    const unreadCount = (data ?? []).filter(
      (message: any) => !message.read_by.includes(userId)
    ).length;

    return unreadCount;
  },
};

export default MessageModel;