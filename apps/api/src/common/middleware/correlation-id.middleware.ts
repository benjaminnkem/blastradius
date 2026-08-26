import { randomUUID } from "node:crypto";
import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const existing = req.headers["x-request-id"] as string | undefined;
    const correlationId = existing && existing.length > 0 ? existing : randomUUID();

    req.headers["x-request-id"] = correlationId;
    res.setHeader("x-request-id", correlationId);

    next();
  }
}
