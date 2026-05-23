// server/src/models/BlogPost.ts

import { supabaseAdmin as supabase } from "../config/supabase";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type BlogType = "free" | "paid";
export type BlogStatus = "draft" | "published" | "archived";

export interface BlogPost {
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

export interface CreateBlogPostPayload {
  author_id: string;
  title: string;
  content: string;
  preview: string;
  type: BlogType;
  status: BlogStatus;
  tags: string[];
  read_time: number;
}

export interface UpdateBlogPostPayload {
  title?: string;
  content?: string;
  preview?: string;
  type?: BlogType;
  status?: BlogStatus;
  tags?: string[];
  read_time?: number;
}

export interface SavedBlogPost {
  id: string;
  user_id: string;
  blog_id: string;
  saved_at: string;
}

export interface BlogPostWithAuthor extends BlogPost {
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

// ─── BlogPost Model ────────────────────────────────────────────────────────────────

const BlogPostModel = {

  // ── Create a new blog post ──────────────────────────────────────────────────

  async create(payload: CreateBlogPostPayload): Promise<BlogPost> {
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

    if (error) throw new Error(`BlogPostModel.create: ${error.message}`);
    return data as BlogPost;
  },

  // ── Get a single blog by ID ─────────────────────────────────────────────────

  async getById(blogId: string): Promise<BlogPostWithAuthor | null> {
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
      throw new Error(`BlogPostModel.getById: ${error.message}`);
    }
    return data as BlogPostWithAuthor;
  },

  // ── Get all published blogs (feed) ─────────────────────────────────────────

  async getAll(limit = 20, offset = 0): Promise<BlogPostWithAuthor[]> {
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

    if (error) throw new Error(`BlogPostModel.getAll: ${error.message}`);
    return (data ?? []) as BlogPostWithAuthor[];
  },

  // ── Get all blogs by a specific author ──────────────────────────────────────

  async getByAuthor(authorId: string): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("author_id", authorId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`BlogPostModel.getByAuthor: ${error.message}`);
    return (data ?? []) as BlogPost[];
  },

  // ── Update a blog post ──────────────────────────────────────────────────────

  async update(blogId: string, payload: UpdateBlogPostPayload): Promise<BlogPost> {
    const { data, error } = await supabase
      .from("blogs")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", blogId)
      .select()
      .single();

    if (error) throw new Error(`BlogPostModel.update: ${error.message}`);
    return data as BlogPost;
  },

  // ── Delete a blog post ──────────────────────────────────────────────────────

  async delete(blogId: string): Promise<void> {
    const { error } = await supabase
      .from("blogs")
      .delete()
      .eq("id", blogId);

    if (error) throw new Error(`BlogPostModel.delete: ${error.message}`);
  },

  // ── Search blogs by title, tag, or author username ──────────────────────────

  async search(query: string, limit = 20): Promise<BlogPostWithAuthor[]> {
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

    if (error) throw new Error(`BlogPostModel.search: ${error.message}`);
    return (data ?? []) as BlogPostWithAuthor[];
  },

  // ── Increment view count ────────────────────────────────────────────────────

  async incrementViews(blogId: string): Promise<void> {
    const { error } = await supabase.rpc("increment_blog_views", {
      blog_id: blogId,
    });

    if (error) throw new Error(`BlogPostModel.incrementViews: ${error.message}`);
  },

  // ── Save a blog (bookmark) ──────────────────────────────────────────────────

  async save(userId: string, blogId: string): Promise<SavedBlogPost> {
    const { data, error } = await supabase
      .from("saved_blogs")
      .insert([{ user_id: userId, blog_id: blogId }])
      .select()
      .single();

    if (error) throw new Error(`BlogPostModel.save: ${error.message}`);

    // increment save_count on blogs table
    await supabase.rpc("increment_blog_saves", { blog_id: blogId });

    return data as SavedBlogPost;
  },

  // ── Unsave a blog (remove bookmark) ────────────────────────────────────────

  async unsave(userId: string, blogId: string): Promise<void> {
    const { error } = await supabase
      .from("saved_blogs")
      .delete()
      .eq("user_id", userId)
      .eq("blog_id", blogId);

    if (error) throw new Error(`BlogPostModel.unsave: ${error.message}`);

    // decrement save_count on blogs table
    await supabase.rpc("decrement_blog_saves", { blog_id: blogId });
  },

  // ── Get all saved blogs for a user ─────────────────────────────────────────

  async getSavedByUser(userId: string): Promise<BlogPostWithAuthor[]> {
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

    if (error) throw new Error(`BlogPostModel.getSavedByUser: ${error.message}`);

    // unwrap the nested blog object
    return (data ?? []).map((row: any) => row.blog) as BlogPostWithAuthor[];
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
      throw new Error(`BlogPostModel.isSaved: ${error.message}`);
    }
    return !!data;
  },

  // ── Get blogs by tag ────────────────────────────────────────────────────────

  async getByTag(tag: string, limit = 20): Promise<BlogPostWithAuthor[]> {
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

    if (error) throw new Error(`BlogPostModel.getByTag: ${error.message}`);
    return (data ?? []) as BlogPostWithAuthor[];
  },

  // ── Change blog status (publish / archive / draft) ──────────────────────────

  async setStatus(blogId: string, status: BlogStatus): Promise<BlogPost> {
    const { data, error } = await supabase
      .from("blogs")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", blogId)
      .select()
      .single();

    if (error) throw new Error(`BlogPostModel.setStatus: ${error.message}`);
    return data as BlogPost;
  },
};

export default BlogPostModel;