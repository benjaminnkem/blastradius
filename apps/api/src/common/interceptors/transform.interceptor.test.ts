import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { of } from "rxjs";
import { describe, expect, it } from "vitest";
import { TransformInterceptor } from "./transform.interceptor.js";

describe("TransformInterceptor", () => {
  it("wraps raw handler response in standard envelope", async () => {
    const interceptor = new TransformInterceptor();

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { "x-request-id": "req-5678" } }),
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: () => of({ test: "data" }),
    };

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);
    result$.subscribe((val) => {
      expect(val).toEqual(
        expect.objectContaining({
          success: true,
          data: { test: "data" },
          requestId: "req-5678",
        }),
      );
    });
  });
});
