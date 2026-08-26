import { type ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { GlobalHttpExceptionFilter } from "./http-exception.filter.js";

describe("GlobalHttpExceptionFilter", () => {
  it("formats HttpException into standard error envelope", () => {
    const filter = new GlobalHttpExceptionFilter();

    const mockJson = vi.fn();
    const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    const mockResponse = { status: mockStatus };
    const mockRequest = { headers: { "x-request-id": "req-1234" } };

    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;

    const exception = new HttpException("Resource not found", HttpStatus.NOT_FOUND);
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: "Resource not found",
        }),
        requestId: "req-1234",
      }),
    );
  });
});
