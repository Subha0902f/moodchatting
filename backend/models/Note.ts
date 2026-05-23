// backend/models/Note.ts
// Business logic layer for note management

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

export interface NoteFilterOptions {
  userId: string;
  search?: string;
  tag?: string;
  isPinned?: boolean;
  color?: NoteColor;
  limit?: number;
  offset?: number;
}

// ─── Note Model (Business Logic) ───────────────────────────────────────────────

const NoteModel = {

  // ── Create a new note ────────────────────────────────────────────────────────

  async createNote(payload: CreateNotePayload): Promise<Note> {
    const { data, error } = await supabase
      .from("notes")
      .insert([
        {
          user_id: payload.userId,
          title: payload.title,
          content: payload.content || "",
          color: payload.color || "default",
          is_pinned: payload.isPinned || false,
          tags: payload.tags || [],
        },
      ])
      .select()
      .single();

    if (error) throw new Error(`NoteModel.createNote: ${error.message}`);

    return this.transformDbRecord(data);
  },

  // ── Get notes for a user with filters ────────────────────────────────────────

  async getNotes(filter: NoteFilterOptions): Promise<Note[]> {
    let query = supabase
      .from("notes")
      .select("*")
      .eq("user_id", filter.userId);

    if (filter.search) {
      query = query.or(`title.ilike.%${filter.search}%,content.ilike.%${filter.search}%`);
    }

    if (filter.tag) {
      query = query.contains("tags", [filter.tag]);
    }

    if (filter.isPinned !== undefined) {
      query = query.eq("is_pinned", filter.isPinned);
    }

    if (filter.color) {
      query = query.eq("color", filter.color);
    }

    // Order by pinned first, then by updated date
    query = query.order("is_pinned", { ascending: false }).order("updated_at", { ascending: false });

    const limit = filter.limit || 50;
    const offset = filter.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw new Error(`NoteModel.getNotes: ${error.message}`);

    return ((data ?? []) as any[]).map((note) => this.transformDbRecord(note));
  },

  // ── Get a single note by ID ──────────────────────────────────────────────────

  async getNoteById(noteId: string): Promise<Note | null> {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("id", noteId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`NoteModel.getNoteById: ${error.message}`);
    }

    return this.transformDbRecord(data);
  },

  // ── Get pinned notes for a user ──────────────────────────────────────────────

  async getPinnedNotes(userId: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .eq("is_pinned", true)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(`NoteModel.getPinnedNotes: ${error.message}`);

    return ((data ?? []) as any[]).map((note) => this.transformDbRecord(note));
  },

  // ── Get notes by tag ─────────────────────────────────────────────────────────

  async getNotesByTag(userId: string, tag: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .contains("tags", [tag])
      .order("updated_at", { ascending: false });

    if (error) throw new Error(`NoteModel.getNotesByTag: ${error.message}`);

    return ((data ?? []) as any[]).map((note) => this.transformDbRecord(note));
  },

  // ── Update a note ────────────────────────────────────────────────────────────

  async updateNote(noteId: string, payload: UpdateNotePayload): Promise<Note> {
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

    if (error) throw new Error(`NoteModel.updateNote: ${error.message}`);

    return this.transformDbRecord(data);
  },

  // ── Toggle pin status of a note ──────────────────────────────────────────────

  async togglePin(noteId: string): Promise<Note> {
    const { data, error } = await supabase
      .from("notes")
      .select("is_pinned")
      .eq("id", noteId)
      .single();

    if (error) throw new Error(`NoteModel.togglePin (fetch): ${error.message}`);

    const newPinStatus = !data.is_pinned;

    const { data: updatedData, error: updateError } = await supabase
      .from("notes")
      .update({ is_pinned: newPinStatus, updated_at: new Date().toISOString() })
      .eq("id", noteId)
      .select()
      .single();

    if (updateError) throw new Error(`NoteModel.togglePin (update): ${updateError.message}`);

    return this.transformDbRecord(updatedData);
  },

  // ── Delete a note ────────────────────────────────────────────────────────────

  async deleteNote(noteId: string): Promise<void> {
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId);

    if (error) throw new Error(`NoteModel.deleteNote: ${error.message}`);
  },

  // ── Get note statistics for a user ───────────────────────────────────────────

  async getNoteStats(userId: string): Promise<{
    totalNotes: number;
    pinnedNotes: number;
    notesByColor: Record<NoteColor, number>;
    topTags: { tag: string; count: number }[];
    notesCreatedThisWeek: number;
  }> {
    const { data, error } = await supabase
      .from("notes")
      .select("color, is_pinned, tags, created_at")
      .eq("user_id", userId);

    if (error) throw new Error(`NoteModel.getNoteStats: ${error.message}`);

    const notesByColor: Record<NoteColor, number> = {
      default: 0, red: 0, orange: 0, yellow: 0, green: 0, blue: 0, purple: 0, pink: 0
    };

    const tagCounts: Record<string, number> = {};
    let pinnedNotes = 0;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    let notesCreatedThisWeek = 0;

    data.forEach((note: any) => {
      notesByColor[note.color as NoteColor]++;
      if (note.is_pinned) pinnedNotes++;

      note.tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });

      const createdAt = new Date(note.created_at);
      if (createdAt >= oneWeekAgo) {
        notesCreatedThisWeek++;
      }
    });

    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalNotes: data.length,
      pinnedNotes,
      notesByColor,
      topTags,
      notesCreatedThisWeek,
    };
  },

  // ── Search notes by content ──────────────────────────────────────────────────

  async searchNotes(userId: string, searchTerm: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(`NoteModel.searchNotes: ${error.message}`);

    return ((data ?? []) as any[]).map((note) => this.transformDbRecord(note));
  },

  // ── Helper: Transform database record to domain model ────────────────────────

  transformDbRecord(data: any): Note {
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
    };
  },
};

export default NoteModel;