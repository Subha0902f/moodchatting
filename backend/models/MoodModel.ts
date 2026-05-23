// backend/models/MoodModel.ts
// Business logic layer for mood management

import { supabaseAdmin as supabase } from "../config/supabase";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type MoodType = "happy" | "sad" | "angry" | "anxious" | "calm" | "excited" | "tired" | "neutral";

export type MoodIntensity = "low" | "medium" | "high";

export interface MoodEntry {
  id: string;
  userId: string;
  moodType: MoodType;
  intensity: MoodIntensity;
  note: string | null;
  tags: string[];
  triggeredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MoodPattern {
  userId: string;
  dominantMood: MoodType;
  averageIntensity: number;
  moodSwings: number;
  period: string;
  insights: string[];
}

export interface CreateMoodEntryPayload {
  userId: string;
  moodType: MoodType;
  intensity?: MoodIntensity;
  note?: string | null;
  tags?: string[];
  triggeredAt?: string;
}

export interface UpdateMoodEntryPayload {
  moodType?: MoodType;
  intensity?: MoodIntensity;
  note?: string | null;
  tags?: string[];
}

export interface MoodFilterOptions {
  userId: string;
  startDate?: string;
  endDate?: string;
  moodType?: MoodType;
  limit?: number;
  offset?: number;
}

// ─── Mood Model (Business Logic) ───────────────────────────────────────────────

const MoodModel = {

  // ── Log a new mood entry ─────────────────────────────────────────────────────

  async logMood(payload: CreateMoodEntryPayload): Promise<MoodEntry> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("mood_entries")
      .insert([
        {
          user_id: payload.userId,
          mood_type: payload.moodType,
          intensity: payload.intensity || "medium",
          note: payload.note || null,
          tags: payload.tags || [],
          triggered_at: payload.triggeredAt || now,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(`MoodModel.logMood: ${error.message}`);

    return this.transformDbRecord(data);
  },

  // ── Get mood entries for a user with filters ─────────────────────────────────

  async getMoodEntries(filter: MoodFilterOptions): Promise<MoodEntry[]> {
    let query = supabase
      .from("mood_entries")
      .select("*")
      .eq("user_id", filter.userId);

    if (filter.startDate) {
      query = query.gte("triggered_at", filter.startDate);
    }
    if (filter.endDate) {
      query = query.lte("triggered_at", filter.endDate);
    }
    if (filter.moodType) {
      query = query.eq("mood_type", filter.moodType);
    }

    query = query.order("triggered_at", { ascending: false });

    const limit = filter.limit || 50;
    const offset = filter.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw new Error(`MoodModel.getMoodEntries: ${error.message}`);

    return ((data ?? []) as any[]).map((entry) => this.transformDbRecord(entry));
  },

  // ── Get current mood for a user (most recent entry) ──────────────────────────

  async getCurrentMood(userId: string): Promise<MoodEntry | null> {
    const { data, error } = await supabase
      .from("mood_entries")
      .select("*")
      .eq("user_id", userId)
      .order("triggered_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`MoodModel.getCurrentMood: ${error.message}`);
    }

    return this.transformDbRecord(data);
  },

  // ── Analyze mood patterns for a user ─────────────────────────────────────────

  async analyzeMoodPattern(userId: string, days: number = 30): Promise<MoodPattern | null> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("mood_entries")
      .select("mood_type, intensity, triggered_at")
      .eq("user_id", userId)
      .gte("triggered_at", startDate.toISOString())
      .order("triggered_at", { ascending: true });

    if (error) throw new Error(`MoodModel.analyzeMoodPattern: ${error.message}`);

    if (!data || data.length === 0) {
      return null;
    }

    // Calculate mood statistics
    const moodCounts: Record<MoodType, number> = {
      happy: 0, sad: 0, angry: 0, anxious: 0, calm: 0, excited: 0, tired: 0, neutral: 0
    };

    const intensityMap: Record<MoodIntensity, number> = { low: 1, medium: 2, high: 3 };
    let totalIntensity = 0;
    let moodSwings = 0;
    let prevMood: MoodType | null = null;

    data.forEach((entry: any) => {
      moodCounts[entry.mood_type as MoodType]++;
      totalIntensity += intensityMap[entry.intensity as MoodIntensity];

      if (prevMood && prevMood !== entry.mood_type) {
        moodSwings++;
      }
      prevMood = entry.mood_type;
    });

    // Find dominant mood
    const dominantMood = Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)[0][0] as MoodType;

    // Generate insights
    const insights = this.generateInsights(moodCounts, dominantMood, moodSwings, data.length);

    return {
      userId,
      dominantMood,
      averageIntensity: totalIntensity / data.length,
      moodSwings,
      period: `${days} days`,
      insights,
    };
  },

  // ── Get mood statistics summary ──────────────────────────────────────────────

  async getMoodStats(userId: string, days: number = 7): Promise<{
    totalEntries: number;
    moodDistribution: Record<MoodType, number>;
    averageIntensity: number;
    mostCommonMood: MoodType;
    entriesByDay: { date: string; count: number }[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("mood_entries")
      .select("mood_type, intensity, triggered_at")
      .eq("user_id", userId)
      .gte("triggered_at", startDate.toISOString());

    if (error) throw new Error(`MoodModel.getMoodStats: ${error.message}`);

    const moodDistribution: Record<MoodType, number> = {
      happy: 0, sad: 0, angry: 0, anxious: 0, calm: 0, excited: 0, tired: 0, neutral: 0
    };

    const intensityMap: Record<MoodIntensity, number> = { low: 1, medium: 2, high: 3 };
    let totalIntensity = 0;
    const entriesByDay: Record<string, number> = {};

    data.forEach((entry: any) => {
      moodDistribution[entry.mood_type as MoodType]++;
      totalIntensity += intensityMap[entry.intensity as MoodIntensity];

      const date = new Date(entry.triggered_at).toISOString().split('T')[0];
      entriesByDay[date] = (entriesByDay[date] || 0) + 1;
    });

    const mostCommonMood = Object.entries(moodDistribution)
      .sort(([, a], [, b]) => b - a)[0][0] as MoodType;

    return {
      totalEntries: data.length,
      moodDistribution,
      averageIntensity: data.length > 0 ? totalIntensity / data.length : 0,
      mostCommonMood,
      entriesByDay: Object.entries(entriesByDay).map(([date, count]) => ({ date, count })),
    };
  },

  // ── Delete a mood entry ──────────────────────────────────────────────────────

  async deleteMoodEntry(entryId: string): Promise<void> {
    const { error } = await supabase
      .from("mood_entries")
      .delete()
      .eq("id", entryId);

    if (error) throw new Error(`MoodModel.deleteMoodEntry: ${error.message}`);
  },

  // ── Update a mood entry ──────────────────────────────────────────────────────

  async updateMoodEntry(entryId: string, payload: UpdateMoodEntryPayload): Promise<MoodEntry> {
    const updateData: any = {};
    if (payload.moodType !== undefined) updateData.mood_type = payload.moodType;
    if (payload.intensity !== undefined) updateData.intensity = payload.intensity;
    if (payload.note !== undefined) updateData.note = payload.note;
    if (payload.tags !== undefined) updateData.tags = payload.tags;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("mood_entries")
      .update(updateData)
      .eq("id", entryId)
      .select()
      .single();

    if (error) throw new Error(`MoodModel.updateMoodEntry: ${error.message}`);

    return this.transformDbRecord(data);
  },

  // ── Get mood entries by tag ──────────────────────────────────────────────────

  async getEntriesByTag(userId: string, tag: string): Promise<MoodEntry[]> {
    const { data, error } = await supabase
      .from("mood_entries")
      .select("*")
      .eq("user_id", userId)
      .contains("tags", [tag])
      .order("triggered_at", { ascending: false });

    if (error) throw new Error(`MoodModel.getEntriesByTag: ${error.message}`);

    return ((data ?? []) as any[]).map((entry) => this.transformDbRecord(entry));
  },

  // ── Helper: Transform database record to domain model ────────────────────────

  transformDbRecord(data: any): MoodEntry {
    return {
      id: data.id,
      userId: data.user_id,
      moodType: data.mood_type,
      intensity: data.intensity,
      note: data.note,
      tags: data.tags,
      triggeredAt: data.triggered_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  // ── Helper: Generate insights based on mood data ─────────────────────────────

  generateInsights(
    moodCounts: Record<MoodType, number>,
    dominantMood: MoodType,
    moodSwings: number,
    totalEntries: number
  ): string[] {
    const insights: string[] = [];

    // Dominant mood insights
    const dominantPercentage = (moodCounts[dominantMood] / totalEntries) * 100;
    insights.push(`Your dominant mood is "${dominantMood}" (${dominantPercentage.toFixed(1)}% of the time)`);

    // Mood swing insights
    if (moodSwings > totalEntries * 0.7) {
      insights.push("You've experienced frequent mood changes. Consider tracking triggers.");
    } else if (moodSwings < totalEntries * 0.2 && totalEntries > 5) {
      insights.push("Your mood has been quite stable during this period.");
    }

    // Specific mood insights
    if (moodCounts.sad + moodCounts.anxious > totalEntries * 0.5) {
      insights.push("You've been feeling down or anxious frequently. Consider reaching out for support.");
    }

    if (moodCounts.happy + moodCounts.excited > totalEntries * 0.5) {
      insights.push("Great job! You've been experiencing positive emotions often.");
    }

    return insights;
  },
};

export default MoodModel;