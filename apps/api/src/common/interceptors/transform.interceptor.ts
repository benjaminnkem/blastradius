import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import type { Request } from "express";
import { type Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface ResponseEnvelope<T> {
  success: boolean;
  data: T;
  requestId: string;
  timestamp: number;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseEnvelope<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseEnvelope<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = (request.headers["x-request-id"] as string) || "unknown";

    return next.handle().pipe(
      map((data) => {
        // If data is already an envelope, return as-is
        if (data && typeof data === "object" && "success" in data && "data" in data) {
          return data;
        }

        return {
          success: true,
          data,
          requestId,
          timestamp: Math.floor(Date.now() / 1000),
        };
      }),
    );
  }
}
