import {
  listUpcomingReminders,
} from "../controllers/remindercontroller";
import { createCrudRoutes } from "./createCrudRoutes";

const router = createCrudRoutes("reminder");

router.get("/upcoming", listUpcomingReminders);

export default router;
