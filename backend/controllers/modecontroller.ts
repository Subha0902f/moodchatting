import { createCrudController } from "./createCrudController";

export const modeController = createCrudController("Mood mode", [
  {
    id: "focus",
    key: "focus",
    name: "Focus",
    description: "For quieter, low-distraction conversations.",
    userIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "social",
    key: "social",
    name: "Social",
    description: "For open and energetic conversations.",
    userIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]);
