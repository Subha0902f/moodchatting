import { createCrudController } from "./createCrudController";

export const channelController = createCrudController("Channel", [
  {
    id: "general",
    name: "General",
    description: "Open community conversation.",
    memberIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wellness",
    name: "Wellness",
    description: "A calmer space for wellness check-ins.",
    memberIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]);
