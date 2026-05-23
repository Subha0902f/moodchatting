import { Router, Request, Response } from "express";

type DataRecord = Record<string, any>;

type RouteError = Error & {
  statusCode?: number;
};

const getRecordId = (record: DataRecord) => String(record.id ?? record.key ?? "");

export const sendRouteError = (res: Response, error: RouteError) => {
  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: error.message || "Something went wrong",
  });
};

export const createHttpError = (statusCode: number, message: string) => {
  const error: RouteError = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const createCrudRouter = (resourceName: string, initialItems: DataRecord[] = []) => {
  const router = Router();
  const items = [...initialItems];

  router.get("/", async (_req: Request, res: Response) => {
    try {
      return res.status(200).json({
        success: true,
        data: items,
      });
    } catch (error: any) {
      return sendRouteError(res, error);
    }
  });

  router.get("/:id", async (req: Request, res: Response) => {
    try {
      const item = items.find((entry) => getRecordId(entry) === req.params.id);

      if (!item) {
        throw createHttpError(404, `${resourceName} not found`);
      }

      return res.status(200).json({
        success: true,
        data: item,
      });
    } catch (error: any) {
      return sendRouteError(res, error);
    }
  });

  router.post("/", async (req: Request, res: Response) => {
    try {
      const now = new Date().toISOString();
      const item = {
        id: req.body?.id ?? `${Date.now()}`,
        ...req.body,
        createdAt: req.body?.createdAt ?? now,
        updatedAt: req.body?.updatedAt ?? now,
      };

      items.push(item);

      return res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error: any) {
      return sendRouteError(res, error);
    }
  });

  router.put("/:id", async (req: Request, res: Response) => {
    try {
      const index = items.findIndex((entry) => getRecordId(entry) === req.params.id);

      if (index === -1) {
        throw createHttpError(404, `${resourceName} not found`);
      }

      items[index] = {
        id: items[index].id,
        ...req.body,
        updatedAt: new Date().toISOString(),
      };

      return res.status(200).json({
        success: true,
        data: items[index],
      });
    } catch (error: any) {
      return sendRouteError(res, error);
    }
  });

  router.patch("/:id", async (req: Request, res: Response) => {
    try {
      const index = items.findIndex((entry) => getRecordId(entry) === req.params.id);

      if (index === -1) {
        throw createHttpError(404, `${resourceName} not found`);
      }

      items[index] = {
        ...items[index],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };

      return res.status(200).json({
        success: true,
        data: items[index],
      });
    } catch (error: any) {
      return sendRouteError(res, error);
    }
  });

  router.delete("/:id", async (req: Request, res: Response) => {
    try {
      const index = items.findIndex((entry) => getRecordId(entry) === req.params.id);

      if (index === -1) {
        throw createHttpError(404, `${resourceName} not found`);
      }

      const [deletedItem] = items.splice(index, 1);

      return res.status(200).json({
        success: true,
        data: deletedItem,
      });
    } catch (error: any) {
      return sendRouteError(res, error);
    }
  });

  return router;
};
