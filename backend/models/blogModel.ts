// server/src/models/blogModel.ts

import { supabaseAdmin as supabase } from "../config/supabase";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type BlogType = "free" | "paid";
export type BlogStatus = "draft" | "published" | "archived";

export interface Blog {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBlogPayload {
  title: string;
  content: string;
}

export interface UpdateBlogPayload {
  title?: string;
  content?: string;
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
  preview: string;
  tags: string[];
  type: BlogType;
  read_time: number;
}

const mapBlogsWithAuthors = async (blogs: Blog[]): Promise<BlogWithAuthor[]> => {
  if (!blogs.length) return [];

  return blogs.map((blog) => ({
    ...blog,
    author: {
      id: "",
      username: "MoodChat User",
      avatar_url: null,
    },
    preview: blog.content?.slice(0, 160) || "",
    tags: [],
    type: "free",
    read_time: Math.max(1, Math.ceil((blog.content?.trim().split(/\s+/).length || 0) / 200)),
  }));
};

const BlogModel = {
  async getAll(limit = 20, offset = 0): Promise<BlogWithAuthor[]> {
    const { data, error } = await supabase
      .from("blogs")
      .select("id,title,content,created_at,updated_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`BlogModel.getAll: ${error.message}`);
    return mapBlogsWithAuthors((data ?? []) as Blog[]);
  },

  async create(payload: CreateBlogPayload): Promise<Blog> {
    const { data, error } = await supabase
      .from("blogs")
      .insert([
        {
          title: payload.title,
          content: payload.content,
        },
      ])
      .select("id,title,content,created_at,updated_at")
      .single();

    if (error) throw new Error(`BlogModel.create: ${error.message}`);
    return data as Blog;
  },

  async getById(blogId: string): Promise<BlogWithAuthor | null> {
    const { data, error } = await supabase
      .from("blogs")
      .select("id,title,content,created_at,updated_at")
      .eq("id", blogId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`BlogModel.getById: ${error.message}`);
    }

    const blog = data as Blog;
    const [blogWithAuthor] = await mapBlogsWithAuthors([blog]);
    return blogWithAuthor;
  },

  async getByAuthor(_authorId: string, limit = 20): Promise<BlogWithAuthor[]> {
    const { data, error } = await supabase
      .from("blogs")
      .select("id,title,content,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`BlogModel.getByAuthor: ${error.message}`);
    return mapBlogsWithAuthors((data ?? []) as Blog[]);
  },

  async update(blogId: string, payload: UpdateBlogPayload): Promise<Blog> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.content !== undefined) updateData.content = payload.content;

    const { data, error } = await supabase
      .from("blogs")
      .update(updateData)
      .eq("id", blogId)
      .select("id,title,content,created_at,updated_at")
      .single();

    if (error) throw new Error(`BlogModel.update: ${error.message}`);
    return data as Blog;
  },

  async delete(blogId: string): Promise<void> {
    const { error } = await supabase
      .from("blogs")
      .delete()
      .eq("id", blogId);

    if (error) throw new Error(`BlogModel.delete: ${error.message}`);
  },

  async search(query: string, limit = 20): Promise<BlogWithAuthor[]> {
    const { data, error } = await supabase
      .from("blogs")
      .select("id,title,content,created_at,updated_at")
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`BlogModel.search: ${error.message}`);
    return mapBlogsWithAuthors((data ?? []) as Blog[]);
  },

  async incrementViews(blogId: string): Promise<void> {
    const { error } = await supabase.rpc("increment_blog_views", {
      blog_id: blogId,
    });

    if (error) throw new Error(`BlogModel.incrementViews: ${error.message}`);
  },

  async save(userId: string, blogId: string): Promise<SavedBlog> {
    const { data, error } = await supabase
      .from("saved_blogs")
      .insert([{ user_id: userId, blog_id: blogId }])
      .select()
      .single();

    if (error) throw new Error(`BlogModel.save: ${error.message}`);

    await supabase.rpc("increment_blog_saves", { blog_id: blogId });
    return data as SavedBlog;
  },

  async unsave(userId: string, blogId: string): Promise<void> {
    const { error } = await supabase
      .from("saved_blogs")
      .delete()
      .eq("user_id", userId)
      .eq("blog_id", blogId);

    if (error) throw new Error(`BlogModel.unsave: ${error.message}`);

    await supabase.rpc("decrement_blog_saves", { blog_id: blogId });
  },

  async getSavedByUser(userId: string): Promise<BlogWithAuthor[]> {
    const { data, error } = await supabase
      .from("saved_blogs")
      .select("blog_id, saved_at")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false });

    if (error) throw new Error(`BlogModel.getSavedByUser: ${error.message}`);

    const savedRows = (data ?? []) as Array<{ blog_id: string; saved_at: string }>;
    if (!savedRows.length) return [];

    const blogIds = savedRows.map((row) => row.blog_id);
    const { data: blogs, error: blogsError } = await supabase
      .from("blogs")
      .select("id,title,content,created_at,updated_at")
      .in("id", blogIds);

    if (blogsError) throw new Error(`BlogModel.getSavedByUser: ${blogsError.message}`);

    const blogMap = new Map((blogs ?? []).map((blog: Blog) => [blog.id, blog]));
    const orderedBlogs = savedRows
      .map((row) => blogMap.get(row.blog_id))
      .filter((blog): blog is Blog => !!blog);

    return mapBlogsWithAuthors(orderedBlogs);
  },

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

  async getByTag(_tag: string, limit = 20): Promise<BlogWithAuthor[]> {
    const { data, error } = await supabase
      .from("blogs")
      .select("id,title,content,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`BlogModel.getByTag: ${error.message}`);
    return mapBlogsWithAuthors((data ?? []) as Blog[]);
  },

  async setStatus(blogId: string, _status: BlogStatus): Promise<Blog> {
    const { data, error } = await supabase
      .from("blogs")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", blogId)
      .select("id,title,content,created_at,updated_at")
      .single();

    if (error) throw new Error(`BlogModel.setStatus: ${error.message}`);
    return data as Blog;
  },
};

export default BlogModel;
