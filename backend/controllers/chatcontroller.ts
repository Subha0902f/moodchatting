import { createHttpError, sendRouteError } from "../routes/routeUtils";

const threads: any[] = [
  {
    id: "starter",
    title: "Starter chat",
    participantIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const messages: any[] = [];

export const listThreads = async (_req: any, res: any) => {
  try {
    return res.status(200).json({ success: true, data: threads });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};

export const createThread = async (req: any, res: any) => {
  try {
    const { participantIds = [], title = "New chat" } = req.body || {};

    const thread = {
      id: `${Date.now()}`,
      title,
      participantIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    threads.push(thread);

    return res.status(201).json({ success: true, data: thread });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};

export const getThread = async (req: any, res: any) => {
  try {
    const thread = threads.find((entry) => entry.id === req.params.threadId);

    if (!thread) {
      throw createHttpError(404, "Chat thread not found");
    }

    return res.status(200).json({ success: true, data: thread });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};

export const updateThread = async (req: any, res: any) => {
  try {
    const index = threads.findIndex((entry) => entry.id === req.params.threadId);

    if (index === -1) {
      throw createHttpError(404, "Chat thread not found");
    }

    threads[index] = {
      ...threads[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    return res.status(200).json({ success: true, data: threads[index] });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};

export const deleteThread = async (req: any, res: any) => {
  try {
    const index = threads.findIndex((entry) => entry.id === req.params.threadId);

    if (index === -1) {
      throw createHttpError(404, "Chat thread not found");
    }

    const [deletedThread] = threads.splice(index, 1);

    return res.status(200).json({ success: true, data: deletedThread });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};

export const listThreadMessages = async (req: any, res: any) => {
  try {
    const threadMessages = messages.filter((message) => message.threadId === req.params.threadId);

    return res.status(200).json({ success: true, data: threadMessages });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};

export const createThreadMessage = async (req: any, res: any) => {
  try {
    const thread = threads.find((entry) => entry.id === req.params.threadId);

    if (!thread) {
      throw createHttpError(404, "Chat thread not found");
    }

    const message = {
      id: `${Date.now()}`,
      threadId: req.params.threadId,
      senderId: req.body?.senderId ?? "anonymous",
      text: req.body?.text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    messages.push(message);

    return res.status(201).json({ success: true, data: message });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};
