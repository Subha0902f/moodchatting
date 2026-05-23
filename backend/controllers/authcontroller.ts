declare const Buffer: any;

import { createHttpError, sendRouteError } from "../routes/routeUtils";

const users: any[] = [];
const sessions = new Map<string, any>();

const createToken = (userId: string) => Buffer.from(`${userId}:${Date.now()}`).toString("base64url");

export const register = async (req: any, res: any) => {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      throw createHttpError(400, "Username, email, and password are required");
    }

    const existingUser = users.find((user) => user.email === email || user.username === username);

    if (existingUser) {
      throw createHttpError(409, "A user with that username or email already exists");
    }

    const user = {
      id: `${Date.now()}`,
      username,
      email,
      name: username,
      createdAt: new Date().toISOString(),
    };
    const token = createToken(user.id);

    users.push({ ...user, password });
    sessions.set(token, user);

    return res.status(201).json({ success: true, data: { user, token } });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};

export const login = async (req: any, res: any) => {
  try {
    const { username, email, password } = req.body || {};

    if ((!username && !email) || !password) {
      throw createHttpError(400, "Username/email and password are required");
    }

    const user = users.find(
      (entry) => (entry.username === username || entry.email === email) && entry.password === password
    );

    if (!user) {
      throw createHttpError(401, "Invalid credentials");
    }

    const token = createToken(user.id);
    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };

    sessions.set(token, safeUser);

    return res.status(200).json({ success: true, data: { user: safeUser, token } });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};

export const logout = async (req: any, res: any) => {
  try {
    const token = String(req.headers.authorization || "").replace("Bearer ", "");

    if (token) {
      sessions.delete(token);
    }

    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};

export const refresh = async (req: any, res: any) => {
  try {
    const token = String(req.headers.authorization || "").replace("Bearer ", "");
    const user = sessions.get(token);

    if (!user) {
      throw createHttpError(401, "Session not found");
    }

    const nextToken = createToken(user.id);
    sessions.delete(token);
    sessions.set(nextToken, user);

    return res.status(200).json({ success: true, data: { user, token: nextToken } });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};

export const me = async (req: any, res: any) => {
  try {
    const token = String(req.headers.authorization || "").replace("Bearer ", "");
    const user = sessions.get(token);

    if (!user) {
      throw createHttpError(401, "Unauthorized");
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    return sendRouteError(res, error);
  }
};
