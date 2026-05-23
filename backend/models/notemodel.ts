// backend/models/notemodel.ts

import { supabaseAdmin as supabase } from "../config/supabase";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type NoteColor = "default" | "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink";

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  color: NoteColor;
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotePayload {
  userId: string;
  title: string;
  content?: string;
  color?: NoteColor;
  isPinned?: boolean;
  tags?: string[];
}

export interface UpdateNotePayload {
  title?: string;
  content?: string;
  color?: NoteColor;
  isPinned?: boolean;
  tags?: string[];
}

// ─── Note Model ────────────────────────────────────────────────────────────────

const noteModel = {

  // ── Create a new note ──────────────────────────────────────────────────

  async create(payload: CreateNotePayload): Promise<Note> {
    const { data, error } = await supabase
      .from("notes")
      .insert([
        {
          user_id: payload.userId,
          title: payload.title,
          content: payload.content || "",
          color: payload.color || "default",
          is_pinned: payload.isPinned !== undefined ? payload.isPinned : false,
          tags: payload.tags || [],
        },
      ])
      .select()
      .single();

    if (error) throw new Error(`noteModel.create: ${error.message}`);

    // Transform snake_case to camelCase
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      content: data.content,
      color: data.color,
      isPinned: data.is_pinned,
      tags: data.tags,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Note;
  },

  // ── Get a single note by ID ─────────────────────────────────────────────────

  async getById(noteId: string): Promise<Note | null> {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("id", noteId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // not found
      throw new Error(`noteModel.getById: ${error.message}`);
    }

    // Transform snake_case to camelCase
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      content: data.content,
      color: data.color,
      isPinned: data.is_pinned,
      tags: data.tags,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Note;
  },

  // ── Get all notes ────────────────────────────────────────────────────────

  async getAll(limit = 20, offset = 0): Promise<Note[]> {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`noteModel.getAll: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((note) => ({
      id: note.id,
      userId: note.user_id,
      title: note.title,
      content: note.content,
      color: note.color,
      isPinned: note.is_pinned,
      tags: note.tags,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    })) as Note[];
  },

  // ── Get notes by user ID ────────────────────────────────────────────────

  async getByUser(userId: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) throw new Error(`noteModel.getByUser: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((note) => ({
      id: note.id,
      userId: note.user_id,
      title: note.title,
      content: note.content,
      color: note.color,
      isPinned: note.is_pinned,
      tags: note.tags,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    })) as Note[];
  },

  // ── Get pinned notes for a user ─────────────────────────────────────────

  async getPinned(userId: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .eq("is_pinned", true)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(`noteModel.getPinned: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((note) => ({
      id: note.id,
      userId: note.user_id,
      title: note.title,
      content: note.content,
      color: note.color,
      isPinned: note.is_pinned,
      tags: note.tags,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    })) as Note[];
  },

  // ── Get notes by tag ────────────────────────────────────────────────────

  async getByTag(userId: string, tag: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .contains("tags", [tag])
      .order("updated_at", { ascending: false });

    if (error) throw new Error(`noteModel.getByTag: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((note) => ({
      id: note.id,
      userId: note.user_id,
      title: note.title,
      content: note.content,
      color: note.color,
      isPinned: note.is_pinned,
      tags: note.tags,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    })) as Note[];
  },

  // ── Search notes ────────────────────────────────────────────────────────

  async search(userId: string, searchTerm: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(`noteModel.search: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((note) => ({
      id: note.id,
      userId: note.user_id,
      title: note.title,
      content: note.content,
      color: note.color,
      isPinned: note.is_pinned,
      tags: note.tags,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    })) as Note[];
  },

  // ── Update a note ──────────────────────────────────────────────────────

  async update(noteId: string, payload: UpdateNotePayload): Promise<Note> {
    const updateData: any = {};
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.content !== undefined) updateData.content = payload.content;
    if (payload.color !== undefined) updateData.color = payload.color;
    if (payload.isPinned !== undefined) updateData.is_pinned = payload.isPinned;
    if (payload.tags !== undefined) updateData.tags = payload.tags;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("notes")
      .update(updateData)
      .eq("id", noteId)
      .select()
      .single();

    if (error) throw new Error(`noteModel.update: ${error.message}`);

    // Transform snake_case to camelCase
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      content: data.content,
      color: data.color,
      isPinned: data.is_pinned,
      tags: data.tags,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Note;
  },

  // ── Delete a note ──────────────────────────────────────────────────────

  async delete(noteId: string): Promise<void> {
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId);

    if (error) throw new Error(`noteModel.delete: ${error.message}`);
  },

  // ── Toggle pin status ──────────────────────────────────────────────────

  async togglePin(noteId: string): Promise<Note> {
    const currentNote = await this.getById(noteId);
    if (!currentNote) {
      throw new Error("Note not found");
    }

    return this.update(noteId, { isPinned: !currentNote.isPinned });
  },
};

export default noteModel;