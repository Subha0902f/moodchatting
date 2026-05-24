import { Request, Response } from "express";
import ReminderModel, { ReminderStatus, ReminderCategory } from "../models/remindermodel";
import { createHttpError, sendRouteError } from "../routes/routeUtils";
import { User } from "../types/user.types";

// A more type-safe request object
interface RequestWithUser extends Request {
  user?: User;
}

const DEMO_USER_ID = "c91f2c3a-5c3c-4c3c-8c3c-3c3c3c3c3c3c";

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Parse natural language into reminder components
 * Supports patterns like: "Remind me to buy milk tomorrow at 3pm" or "Doctor appointment next Monday"
 */
const parseReminderFromChat = (text: string): Partial<{
  title: string;
  dueDate: string;
  dueTime: string;
  category: ReminderCategory;
  priority: "low" | "medium" | "high";
}> => {
  const result: any = {};

  // Extract title
  const reminderMatch = text.match(/remind me to (.+?)(?:tomorrow|today|next|monday|tuesday|wednesday|thursday|friday|saturday|sunday|at|in |\d|$)/i);
  if (reminderMatch) {
    result.title = reminderMatch[1].trim();
  } else {
    result.title = text.trim();
  }

  // Extract date
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  if (/tomorrow/i.test(text)) {
    result.dueDate = tomorrow.toISOString().split("T")[0];
  } else if (/today/i.test(text)) {
    result.dueDate = today.toISOString().split("T")[0];
  } else if (/next\s+monday/i.test(text)) {
    const nextMonday = new Date(today);
    nextMonday.setDate(nextMonday.getDate() + (1 + 7 - nextMonday.getDay()) % 7 || 7);
    result.dueDate = nextMonday.toISOString().split("T")[0];
  } else if (/next\s+week/i.test(text)) {
    result.dueDate = nextWeek.toISOString().split("T")[0];
  } else {
    result.dueDate = today.toISOString().split("T")[0];
  }

  // Extract time
  const timeMatch = text.match(/at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const ampm = timeMatch[3]?.toLowerCase();

    if (ampm === "pm" && hour !== 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;

    result.dueTime = `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  // Extract category
  const categoryPatterns: Array<[RegExp, ReminderCategory]> = [
    [/(buy|purchase|shopping|shop)/i, "shopping"],
    [/(work|meeting|call|presentation|project)/i, "work"],
    [/(doctor|hospital|medicine|health|exercise|gym)/i, "health"],
    [/(pay|bill|invoice|budget|finance|tax)/i, "finance"],
  ];

  for (const [pattern, category] of categoryPatterns) {
    if (pattern.test(text)) {
      result.category = category;
      break;
    }
  }

  // Extract priority
  if (/(urgent|asap|immediately|important|critical|!)/i.test(text)) {
    result.priority = "high";
  } else if (/(low priority|whenever|not urgent)/i.test(text)) {
    result.priority = "low";
  } else {
    result.priority = "medium";
  }

  return result;
};

// ─── CRUD Operations ──────────────────────────────────────────────────────────

export const getAllReminders = async (req: RequestWithUser, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const reminders = await ReminderModel.getAll(limit, offset);
    res.status(200).json({ success: true, data: reminders });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const getReminderById = async (req: RequestWithUser, res: Response) => {
  try {
    const reminderId = req.params.reminderId as string;
    const reminder = await ReminderModel.getById(reminderId);
    if (!reminder) {
      throw createHttpError(404, "Reminder not found");
    }
    res.status(200).json({ success: true, data: reminder });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const createReminder = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id || DEMO_USER_ID;
    const { title, description, dueDate, dueTime, category, priority, isRecurring, recurrenceType, recurrenceEndDate, tags } = req.body;

    if (!title || !dueDate) {
      throw createHttpError(400, "Title and dueDate are required");
    }

    const newReminder = await ReminderModel.create({
      userId,
      title,
      description,
      dueDate,
      dueTime,
      category,
      priority,
      isRecurring,
      recurrenceType,
      recurrenceEndDate,
      tags,
    });

    res.status(201).json({ success: true, data: newReminder });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const updateReminder = async (req: RequestWithUser, res: Response) => {
  try {
    const reminderId = req.params.reminderId as string;
    const updatedReminder = await ReminderModel.update(reminderId, req.body);
    res.status(200).json({ success: true, data: updatedReminder });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const deleteReminder = async (req: RequestWithUser, res: Response) => {
  try {
    const reminderId = req.params.reminderId as string;
    await ReminderModel.delete(reminderId);
    res.status(200).json({ success: true, message: "Reminder deleted" });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

// ─── Reminder Chatbot & Advanced Operations ────────────────────────────────────

export const chatbotCreateReminder = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id || DEMO_USER_ID;
    const { message } = req.body;

    if (!message) {
      throw createHttpError(400, "Message is required");
    }

    // Parse natural language
    const parsed = parseReminderFromChat(message);

    if (!parsed.title) {
      throw createHttpError(400, "Could not parse reminder from message. Try 'Remind me to [task] tomorrow at [time]'");
    }

    // Create reminder with parsed data
    const newReminder = await ReminderModel.create({
      userId,
      title: parsed.title,
      dueDate: parsed.dueDate!,
      dueTime: parsed.dueTime,
      category: parsed.category,
      priority: parsed.priority,
    });

    res.status(201).json({
      success: true,
      message: `✅ Reminder created: "${parsed.title}" on ${parsed.dueDate}${parsed.dueTime ? " at " + parsed.dueTime : ""}`,
      data: newReminder,
    });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const listUpcomingReminders = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id || DEMO_USER_ID;
    const days = parseInt(req.query.days as string) || 7;
    const reminders = await ReminderModel.getUpcoming(userId, days);
    res.status(200).json({ success: true, data: reminders });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const getUserReminders = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id || DEMO_USER_ID;
    const reminders = await ReminderModel.getByUser(userId);
    res.status(200).json({ success: true, data: reminders });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const getRemindersByStatus = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id || DEMO_USER_ID;
    const status = req.params.status as ReminderStatus;

    const validStatuses: ReminderStatus[] = ["pending", "completed", "overdue", "cancelled"];
    if (!validStatuses.includes(status)) {
      throw createHttpError(400, `Invalid status. Valid statuses: ${validStatuses.join(", ")}`);
    }

    const reminders = await ReminderModel.getByStatus(userId, status);
    res.status(200).json({ success: true, data: reminders });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const getRemindersByCategory = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id || DEMO_USER_ID;
    const category = req.params.category as ReminderCategory;

    const validCategories: ReminderCategory[] = ["personal", "work", "health", "shopping", "finance", "other"];
    if (!validCategories.includes(category)) {
      throw createHttpError(400, `Invalid category. Valid categories: ${validCategories.join(", ")}`);
    }

    const reminders = await ReminderModel.getByCategory(userId, category);
    res.status(200).json({ success: true, data: reminders });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const getOverdueReminders = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id || DEMO_USER_ID;
    const reminders = await ReminderModel.getOverdue(userId);
    res.status(200).json({ success: true, data: reminders });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const markReminderCompleted = async (req: RequestWithUser, res: Response) => {
  try {
    const reminderId = req.params.reminderId as string;
    const completed = await ReminderModel.markCompleted(reminderId);
    res.status(200).json({ success: true, message: "Reminder marked as completed", data: completed });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const searchReminders = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id || DEMO_USER_ID;
    const query = req.query.q as string;

    if (!query) {
      throw createHttpError(400, "Search query is required");
    }

    const reminders = await ReminderModel.search(userId, query);
    res.status(200).json({ success: true, data: reminders });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const getRemindersByTag = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id || DEMO_USER_ID;
    const tag = req.params.tag as string;
    const reminders = await ReminderModel.getByTag(userId, tag);
    res.status(200).json({ success: true, data: reminders });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};

export const getReminderStats = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id || DEMO_USER_ID;

    const pending = await ReminderModel.getByStatus(userId, "pending");
    const completed = await ReminderModel.getByStatus(userId, "completed");
    const overdue = await ReminderModel.getOverdue(userId);

    res.status(200).json({
      success: true,
      data: {
        total: pending.length + completed.length + overdue.length,
        pending: pending.length,
        completed: completed.length,
        overdue: overdue.length,
        completionRate: completed.length > 0 ? Math.round((completed.length / (completed.length + pending.length)) * 100) : 0,
      },
    });
  } catch (error: any) {
    sendRouteError(res, error);
  }
};
