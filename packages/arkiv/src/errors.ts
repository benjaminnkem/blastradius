export class ArkivError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly details?: unknown;

  constructor(
    message: string,
    options?: { code?: string; retryable?: boolean; cause?: unknown; details?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = "ArkivError";
    this.code = options?.code ?? "ARKIV_ERROR";
    this.retryable = options?.retryable ?? false;
    this.details = options?.details;
  }
}

export class ArkivQueryUnavailableError extends ArkivError {
  constructor(message: string, options?: { cause?: unknown; details?: unknown }) {
    super(message, {
      code: "ARKIV_QUERY_UNAVAILABLE",
      retryable: true,
      cause: options?.cause,
      details: options?.details,
    });
    this.name = "ArkivQueryUnavailableError";
  }
}

export class ArkivWriteRejectedError extends ArkivError {
  constructor(message: string, options?: { cause?: unknown; details?: unknown }) {
    super(message, {
      code: "ARKIV_WRITE_REJECTED",
      retryable: false,
      cause: options?.cause,
      details: options?.details,
    });
    this.name = "ArkivWriteRejectedError";
  }
}

export class ArkivWriteUnknownError extends ArkivError {
  readonly txHash?: string;

  constructor(message: string, options?: { txHash?: string; cause?: unknown; details?: unknown }) {
    super(message, {
      code: "ARKIV_WRITE_UNKNOWN",
      retryable: true,
      cause: options?.cause,
      details: options?.details,
    });
    this.name = "ArkivWriteUnknownError";
    this.txHash = options?.txHash;
  }
}

export class HealthAssertionCannotBeExtendedError extends ArkivError {
  constructor(entityKey?: string) {
    super(
      `HealthAssertion entities cannot be extended: each health assertion is strictly ephemeral and represents one point-in-time observation (entityKey=${entityKey ?? "unknown"}).`,
      {
        code: "HEALTH_ASSERTION_CANNOT_BE_EXTENDED",
        retryable: false,
      },
    );
    this.name = "HealthAssertionCannotBeExtendedError";
  }
}

export class ArkivEntityNotFoundError extends ArkivError {
  readonly entityKey: string;

  constructor(entityKey: string) {
    super(`Arkiv entity with key '${entityKey}' was not found or has expired.`, {
      code: "ARKIV_ENTITY_NOT_FOUND",
      retryable: false,
    });
    this.name = "ArkivEntityNotFoundError";
    this.entityKey = entityKey;
  }
}

export class ArkivHistoricalQueryNotSupportedError extends ArkivError {
  constructor(blockNumber?: number) {
    super(
      `Historical querying at block ${blockNumber ?? "unknown"} is feature-gated and not currently enabled/verified for this active network.`,
      {
        code: "ARKIV_HISTORICAL_QUERY_NOT_SUPPORTED",
        retryable: false,
      },
    );
    this.name = "ArkivHistoricalQueryNotSupportedError";
  }
}

export class ArkivValidationError extends ArkivError {
  constructor(message: string, options?: { details?: unknown }) {
    super(message, {
      code: "ARKIV_VALIDATION_ERROR",
      retryable: false,
      details: options?.details,
    });
    this.name = "ArkivValidationError";
  }
}
