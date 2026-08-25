import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import type { ArkivRuntimeConfig } from "@blastradius/config";
import {
  type DependencyEdgeWriteInput,
  DependencyEdgeWriteInputSchema,
  type HealthAssertionWriteInput,
  HealthAssertionWriteInputSchema,
  type MonitorMethodWriteInput,
  MonitorMethodWriteInputSchema,
  type ProtocolResponseWriteInput,
  ProtocolResponseWriteInputSchema,
} from "@blastradius/schemas";
import { toArkivAttributes } from "./attributes.js";
import { createArkivWalletClient } from "./client.js";
import {
  ArkivWriteRejectedError,
  ArkivWriteUnknownError,
  HealthAssertionCannotBeExtendedError,
} from "./errors.js";

export interface PublishResult {
  entityKey: string;
  txHash: string;
  creator: string;
  expiresInSec: number;
}

export interface ExtendResult {
  entityKey: string;
  txHash: string;
  expiresInSec: number;
}

export interface ExtendEligibleEntityInput {
  entityKey: string;
  kind: "dependency_edge" | "monitor_method" | "protocol_response" | "health_assertion";
  expiresInSec: number;
}

export class ArkivWriter {
  constructor(private readonly config: ArkivRuntimeConfig) {}

  private normalizeExpiresIn(seconds: number): number {
    // Arkiv requires positive multiple of 2 seconds (block time = 2s)
    const validSec = Math.max(2, Math.ceil(seconds / 2) * 2);
    return ExpirationTime.fromSeconds(validSec);
  }

  async publishDependencyEdge(
    input: DependencyEdgeWriteInput,
    privateKey: string,
  ): Promise<PublishResult> {
    const validated = DependencyEdgeWriteInputSchema.parse(input);
    const walletClient = createArkivWalletClient(this.config, privateKey);
    const creator = walletClient.account.address.toLowerCase();

    try {
      const attributes = toArkivAttributes(validated.attributes);
      const payload = jsonToPayload(validated.payload);
      const expiresIn = this.normalizeExpiresIn(validated.expiresInSec);

      const result = await walletClient.createEntity({
        payload,
        contentType: "application/json",
        attributes,
        expiresIn,
      });

      return {
        entityKey: result.entityKey,
        txHash: result.txHash,
        creator,
        expiresInSec: expiresIn,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new ArkivWriteUnknownError(
          `Publishing DependencyEdge broadcast timed out: ${error.message}`,
          { cause: error },
        );
      }
      throw new ArkivWriteRejectedError(
        `Failed to publish DependencyEdge: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }

  async publishHealthAssertion(
    input: HealthAssertionWriteInput,
    privateKey: string,
  ): Promise<PublishResult> {
    const validated = HealthAssertionWriteInputSchema.parse(input);
    const walletClient = createArkivWalletClient(this.config, privateKey);
    const creator = walletClient.account.address.toLowerCase();

    try {
      const attributes = toArkivAttributes(validated.attributes);
      const payload = jsonToPayload(validated.payload);
      const expiresIn = this.normalizeExpiresIn(validated.expiresInSec);

      const result = await walletClient.createEntity({
        payload,
        contentType: "application/json",
        attributes,
        expiresIn,
      });

      return {
        entityKey: result.entityKey,
        txHash: result.txHash,
        creator,
        expiresInSec: expiresIn,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new ArkivWriteUnknownError(
          `Publishing HealthAssertion broadcast timed out: ${error.message}`,
          { cause: error },
        );
      }
      throw new ArkivWriteRejectedError(
        `Failed to publish HealthAssertion: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }

  async publishMonitorMethod(
    input: MonitorMethodWriteInput,
    privateKey: string,
  ): Promise<PublishResult> {
    const validated = MonitorMethodWriteInputSchema.parse(input);
    const walletClient = createArkivWalletClient(this.config, privateKey);
    const creator = walletClient.account.address.toLowerCase();

    try {
      const attributes = toArkivAttributes(validated.attributes);
      const payload = jsonToPayload(validated.payload);
      const expiresIn = this.normalizeExpiresIn(validated.expiresInSec);

      const result = await walletClient.createEntity({
        payload,
        contentType: "application/json",
        attributes,
        expiresIn,
      });

      return {
        entityKey: result.entityKey,
        txHash: result.txHash,
        creator,
        expiresInSec: expiresIn,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new ArkivWriteUnknownError(
          `Publishing MonitorMethod broadcast timed out: ${error.message}`,
          { cause: error },
        );
      }
      throw new ArkivWriteRejectedError(
        `Failed to publish MonitorMethod: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }

  async publishProtocolResponse(
    input: ProtocolResponseWriteInput,
    privateKey: string,
  ): Promise<PublishResult> {
    const validated = ProtocolResponseWriteInputSchema.parse(input);
    const walletClient = createArkivWalletClient(this.config, privateKey);
    const creator = walletClient.account.address.toLowerCase();

    try {
      const attributes = toArkivAttributes(validated.attributes);
      const payload = jsonToPayload(validated.payload);
      const expiresIn = this.normalizeExpiresIn(validated.expiresInSec);

      const result = await walletClient.createEntity({
        payload,
        contentType: "application/json",
        attributes,
        expiresIn,
      });

      return {
        entityKey: result.entityKey,
        txHash: result.txHash,
        creator,
        expiresInSec: expiresIn,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new ArkivWriteUnknownError(
          `Publishing ProtocolResponse broadcast timed out: ${error.message}`,
          { cause: error },
        );
      }
      throw new ArkivWriteRejectedError(
        `Failed to publish ProtocolResponse: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }

  /**
   * Extends the lifespan of an eligible entity.
   * Hard Invariant: Refuses to extend HealthAssertion entities.
   */
  async extendEntity(input: ExtendEligibleEntityInput, privateKey: string): Promise<ExtendResult> {
    if (input.kind === "health_assertion") {
      throw new HealthAssertionCannotBeExtendedError(input.entityKey);
    }

    const walletClient = createArkivWalletClient(this.config, privateKey);
    const entityKey = (
      input.entityKey.startsWith("0x") ? input.entityKey : `0x${input.entityKey}`
    ) as `0x${string}`;

    try {
      const expiresIn = this.normalizeExpiresIn(input.expiresInSec);

      const result = await walletClient.extendEntity({
        entityKey,
        expiresIn,
      });

      return {
        entityKey: input.entityKey,
        txHash: result.txHash,
        expiresInSec: expiresIn,
      };
    } catch (error) {
      if (error instanceof HealthAssertionCannotBeExtendedError) {
        throw error;
      }
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new ArkivWriteUnknownError(
          `Extending entity ${input.entityKey} timed out: ${error.message}`,
          { cause: error },
        );
      }
      throw new ArkivWriteRejectedError(
        `Failed to extend entity ${input.entityKey}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }
}
