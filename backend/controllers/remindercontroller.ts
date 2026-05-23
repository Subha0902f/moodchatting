import { createCrudController } from "./createCrudController";
import { sendRouteError } from "../routes/routeUtils";

export const reminderController = createCrudController("Reminder", []);

export const listUpcomingReminders = async (_req: any, res: any) => {
  try {
    return res.status(200).json({
      success: true,
      data: [],
    });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};
