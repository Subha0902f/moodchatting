import { Router } from "express";
import {
  getAllReminders,
  getReminderById,
  createReminder,
  updateReminder,
  deleteReminder,
  chatbotCreateReminder,
  listUpcomingReminders,
  getUserReminders,
  getRemindersByStatus,
  getRemindersByCategory,
  getOverdueReminders,
  markReminderCompleted,
  searchReminders,
  getRemindersByTag,
  getReminderStats,
} from "../controllers/remindercontroller";

const router = Router();

// ─── Basic CRUD Routes ────────────────────────────────────────────────────────

router.get("/", getAllReminders);                      // Get all reminders
router.post("/", createReminder);                      // Create reminder
router.get("/:reminderId", getReminderById);          // Get single reminder
router.patch("/:reminderId", updateReminder);         // Update reminder
router.delete("/:reminderId", deleteReminder);        // Delete reminder

// ─── Chatbot Routes ────────────────────────────────────────────────────────────

router.post("/chatbot/create", chatbotCreateReminder); // Create reminder via natural language

// ─── Advanced Query Routes ────────────────────────────────────────────────────

router.get("/list/upcoming", listUpcomingReminders);   // Get upcoming reminders
router.get("/list/user", getUserReminders);            // Get all user reminders
router.get("/list/status/:status", getRemindersByStatus); // Get by status (pending, completed, etc)
router.get("/list/category/:category", getRemindersByCategory); // Get by category
router.get("/list/overdue", getOverdueReminders);      // Get overdue reminders
router.get("/list/tags/:tag", getRemindersByTag);      // Get by tag
router.get("/stats/summary", getReminderStats);        // Get reminder statistics

// ─── Action Routes ────────────────────────────────────────────────────────────

router.patch("/:reminderId/complete", markReminderCompleted); // Mark as completed
router.get("/search", searchReminders);                // Search reminders

export default router;
