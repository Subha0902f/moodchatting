// server/src/models/blogModel.ts

import { supabaseAdmin as supabase } from "../config/supabase";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type BlogType = "free" | "paid";
export type BlogStatus = "draft" | "published" | "archived";

export interface Blog {
  id: string;
  author_id: string; 
  title: string;
  content: string;
  preview: string;
  type: BlogType;
  status: BlogStatus;
  tags: string[];
  read_time: number;        // in minutes
  view_count: number;
  save_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBlogPayload {
  author_id: string;
  title: string;
  content: string;
  preview: string;
  type: BlogType;
  status: BlogStatus;
  tags: string[];
  read_time: number;
}

export interface UpdateBlogPayload {
  title?: string;
  content?: string;
  preview?: string;
  type?: BlogType;
  status?: BlogStatus;
  tags?: string[];
  read_time?: number;
}

export interface SavedBlog {
  id: string;
  user_id: string;
  blog_id: string;
  saved_at: string;
}

export interface BlogWithAuthor extends Blog {
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

// ─── Blog Model ────────────────────────────────────────────────────────────────

const BlogModel = {

  // ── Get all blogs (published) ──────────────────────────────────────────────────

  async getAll(limit = 20, offset = 0): Promise<BlogWithAuthor[]> {
    const { data, error } = await supabase
      .from("blogs")
      .select(`
        *,
        author:users (
          id,
          username,
          avatar_url
        )
      `)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`BlogModel.getAll: ${error.message}`);
    return (data ?? []) as BlogWithAuthor[];
  },

  // ── Create a new blog post ──────────────────────────────────────────────────

  async create(payload: CreateBlogPayload): Promise<Blog> {
    const { data, error } = await supabase
      .from("blogs")
      .insert([
        {
          author_id: payload.author_id,
          title: payload.title,
          content: payload.content,
          preview: payload.preview,
          type: payload.type,
          status: payload.status,
          tags: payload.tags,
          read_time: payload.read_time,
          view_count: 0,
          save_count: 0,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(`BlogModel.create: ${error.message}`);
    return data as Blog;
  },

  // ── Get a single blog by ID ─────────────────────────────────────────────────

  async getById(blogId: string): Promise<BlogWithAuthor | null> {
    const { data, error } = await supabase
      .from("blogs")
      .select(`
        *,
        author:users (
          id,
          username,
          avatar_url
        )
      `)
      .eq("id", blogId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // not found
      throw new Error(`BlogModel.getById: ${error.message}`);
    }
    return data as BlogWithAuthor;
  },

  // ── Get all published blogs (feed) ─────────────────────────────────────────

  async getAll(limit = 20, offset = 0): Promise<BlogWithAuthor[]> {
    const { data, error } = await supabase
      .from("blogs")
      .select(`
        *,
        author:users (
          id,
          username,
          avatar_url
        )
      `)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`BlogModel.getAll: ${error.message}`);
    return (data ?? []) as BlogWithAuthor[];
  },

  // ── Get all blogs by a specific author ──────────────────────────────────────

  async getByAuthor(authorId: string): Promise<Blog[]> {
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("author_id", authorId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`BlogModel.getByAuthor: ${error.message}`);
    return (data ?? []) as Blog[];
  },

  // ── Update a blog post ──────────────────────────────────────────────────────

  async update(blogId: string, payload: UpdateBlogPayload): Promise<Blog> {
    const { data, error } = await supabase
      .from("blogs")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", blogId)
      .select()
      .single();

    if (error) throw new Error(`BlogModel.update: ${error.message}`);
    return data as Blog;
  },

  // ── Delete a blog post ──────────────────────────────────────────────────────

  async delete(blogId: string): Promise<void> {
    const { error } = await supabase
      .from("blogs")
      .delete()
      .eq("id", blogId);

    if (error) throw new Error(`BlogModel.delete: ${error.message}`);
  },

  // ── Search blogs by title, tag, or author username ──────────────────────────

  async search(query: string, limit = 20): Promise<BlogWithAuthor[]> {
    const { data, error } = await supabase
      .from("blogs")
      .select(`
        *,
        author:users (
          id,
          username,
          avatar_url
        )
      `)
      .eq("status", "published")
      .or(
        `title.ilike.%${query}%,tags.cs.{${query}}`
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`BlogModel.search: ${error.message}`);
    return (data ?? []) as BlogWithAuthor[];
  },

  // ── Increment view count ────────────────────────────────────────────────────

  async incrementViews(blogId: string): Promise<void> {
    const { error } = await supabase.rpc("increment_blog_views", {
      blog_id: blogId,
    });

    if (error) throw new Error(`BlogModel.incrementViews: ${error.message}`);
  },

  // ── Save a blog (bookmark) ──────────────────────────────────────────────────

  async save(userId: string, blogId: string): Promise<SavedBlog> {
    const { data, error } = await supabase
      .from("saved_blogs")
      .insert([{ user_id: userId, blog_id: blogId }])
      .select()
      .single();

    if (error) throw new Error(`BlogModel.save: ${error.message}`);

    // increment save_count on blogs table
    await supabase.rpc("increment_blog_saves", { blog_id: blogId });

    return data as SavedBlog;
  },

  // ── Unsave a blog (remove bookmark) ────────────────────────────────────────

  async unsave(userId: string, blogId: string): Promise<void> {
    const { error } = await supabase
      .from("saved_blogs")
      .delete()
      .eq("user_id", userId)
      .eq("blog_id", blogId);

    if (error) throw new Error(`BlogModel.unsave: ${error.message}`);

    // decrement save_count on blogs table
    await supabase.rpc("decrement_blog_saves", { blog_id: blogId });
  },

  // ── Get all saved blogs for a user ─────────────────────────────────────────

  async getSavedByUser(userId: string): Promise<BlogWithAuthor[]> {
    const { data, error } = await supabase
      .from("saved_blogs")
      .select(`
        blog:blogs (
          *,
          author:users (
            id,
            username,
            avatar_url
          )
        )
      `)
      .eq("user_id", userId)
      .order("saved_at", { ascending: false });

    if (error) throw new Error(`BlogModel.getSavedByUser: ${error.message}`);

    // unwrap the nested blog object
    return (data ?? []).map((row: any) => row.blog) as BlogWithAuthor[];
  },

  // ── Check if a user has saved a blog ───────────────────────────────────────

  async isSaved(userId: string, blogId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("saved_blogs")
      .select("id")
      .eq("user_id", userId)
      .eq("blog_id", blogId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`BlogModel.isSaved: ${error.message}`);
    }
    return !!data;
  },

  // ── Get blogs by author ────────────────────────────────────────────────────

  async getByAuthor(authorId: string, limit = 20): Promise<BlogWithAuthor[]> {
    const { data, error } = await supabase
      .from("blogs")
      .select(`
        *,
        author:users (
          id,
          username,
          avatar_url
        )
      `)
      .eq("author_id", authorId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`BlogModel.getByAuthor: ${error.message}`);
    return (data ?? []) as BlogWithAuthor[];
  },

  // ── Get blogs by tag ────────────────────────────────────────────────────────

  async getByTag(tag: string, limit = 20): Promise<BlogWithAuthor[]> {
    const { data, error } = await supabase
      .from("blogs")
      .select(`
        *,
        author:users (
          id,
          username,
          avatar_url
        )
      `)
      .eq("status", "published")
      .contains("tags", [tag])
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`BlogModel.getByTag: ${error.message}`);
    return (data ?? []) as BlogWithAuthor[];
  },

  // ── Change blog status (publish / archive / draft) ──────────────────────────

  async setStatus(blogId: string, status: BlogStatus): Promise<Blog> {
    const { data, error } = await supabase
      .from("blogs")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", blogId)
      .select()
      .single();

    if (error) throw new Error(`BlogModel.setStatus: ${error.message}`);
    return data as Blog;
  },
};

export default BlogModel;