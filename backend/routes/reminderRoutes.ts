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

router.post("/chatbot/create", chatbotCreateReminder);

router.get("/list/upcoming", listUpcomingReminders);
router.get("/list/user", getUserReminders);
router.get("/list/status/:status", getRemindersByStatus);
router.get("/list/category/:category", getRemindersByCategory);
router.get("/list/overdue", getOverdueReminders);
router.get("/list/tags/:tag", getRemindersByTag);
router.get("/stats/summary", getReminderStats);
router.get("/search", searchReminders);

router.get("/", getAllReminders);
router.post("/", createReminder);
router.get("/:reminderId", getReminderById);
router.patch("/:reminderId/complete", markReminderCompleted);
router.patch("/:reminderId", updateReminder);
router.delete("/:reminderId", deleteReminder);

export default router;
