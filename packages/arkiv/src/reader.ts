import { eq, type Predicate } from "@arkiv-network/sdk/query";
import type { ArkivRuntimeConfig } from "@blastradius/config";
import {
  type ArkivEntityRecord,
  type ArkivNormalizedMetadata,
  type BoundedResult,
  type DependencyEdgeRecord,
  DependencyEdgeRecordSchema,
  type HealthAssertionRecord,
  HealthAssertionRecordSchema,
  type MonitorMethodRecord,
  MonitorMethodRecordSchema,
  type ProtocolResponseRecord,
  ProtocolResponseRecordSchema,
  type TruncationReason,
} from "@blastradius/schemas";
import { fromArkivAttributes } from "./attributes.js";
import type { ArkivPublicClient } from "./client.js";
import { ArkivQueryUnavailableError } from "./errors.js";

export interface QueryPaginationOptions {
  pageSize?: number;
  maxPages?: number;
  maxRecords?: number;
  signal?: AbortSignal;
}

export interface BaseEntityFilter {
  project?: string;
  createdBy?: string;
  ownedBy?: string;
}

export interface ListDependencyEdgesFilter extends BaseEntityFilter {
  dependent_id?: string;
  dependency_id?: string;
  dependent_type?: string;
  dependency_type?: string;
  protocol_id?: string;
  state?: string;
  chain_id?: number;
}

export interface ListHealthAssertionsFilter extends BaseEntityFilter {
  dependency_id?: string;
  dependency_type?: string;
  method_id?: string;
  state?: string;
  chain_id?: number;
}

export interface ListMonitorMethodsFilter extends BaseEntityFilter {
  method_id?: string;
  dependency_type?: string;
  version?: number;
}

export interface ListProtocolResponsesFilter extends BaseEntityFilter {
  protocol_id?: string;
  dependency_id?: string;
  action?: string;
  chain_id?: number;
}

export class ArkivReader {
  constructor(
    private readonly client: ArkivPublicClient,
    private readonly config: ArkivRuntimeConfig,
    private readonly projectNamespace: string = "blastradius-v1",
  ) {}

  private extractPayloadJson(entity: {
    payload?: Uint8Array | null;
    toJson?: () => unknown;
  }): unknown {
    if (typeof entity.toJson === "function") {
      try {
        return entity.toJson();
      } catch {
        // Fall through to TextDecoder
      }
    }
    if (entity.payload && entity.payload instanceof Uint8Array) {
      try {
        const text = new TextDecoder().decode(entity.payload);
        return JSON.parse(text);
      } catch {
        return null;
      }
    }
    return null;
  }

  private normalizeEntity(entity: {
    key: `0x${string}` | string;
    creator?: `0x${string}` | string;
    owner?: `0x${string}` | string;
    createdAtBlock?: bigint | number;
    expiresAtBlock?: bigint | number;
    attributes?: readonly { key: string; value: string | number }[];
    payload?: Uint8Array | null;
    toJson?: () => unknown;
  }): {
    metadata: ArkivNormalizedMetadata;
    attributes: Record<string, string | number>;
    payload: unknown;
  } {
    const rawAttrs = fromArkivAttributes(entity.attributes);
    const creator = (
      entity.creator ?? "0x0000000000000000000000000000000000000000"
    ).toLowerCase() as `0x${string}`;
    const owner = (entity.owner ?? creator).toLowerCase() as `0x${string}`;
    const createdAtBlock = Number(entity.createdAtBlock ?? 1);
    const expiresAtBlock = Number(entity.expiresAtBlock ?? 1);

    const metadata: ArkivNormalizedMetadata = {
      key: entity.key,
      creator,
      owner,
      createdAtBlock,
      expiresAtBlock,
    };

    const payload = this.extractPayloadJson(entity);

    return {
      metadata,
      attributes: rawAttrs,
      payload,
    };
  }

  private async executePaginatedQuery<T>(
    predicates: Predicate[],
    filter: BaseEntityFilter | undefined,
    options: QueryPaginationOptions | undefined,
    parser: (normalized: {
      metadata: ArkivNormalizedMetadata;
      attributes: Record<string, string | number>;
      payload: unknown;
    }) => T | null,
  ): Promise<BoundedResult<T>> {
    const pageSize = Math.min(
      options?.pageSize ?? this.config.queryPageSize,
      this.config.queryPageSize,
      200,
    );
    const maxPages = options?.maxPages ?? this.config.queryMaxPages;
    const maxRecords = options?.maxRecords ?? 5000;
    const signal = options?.signal;

    const items: T[] = [];
    const seenEntityKeys = new Set<string>();
    let complete = true;
    let truncatedReason: TruncationReason | undefined;

    try {
      let query = this.client
        .select({
          key: true,
          creator: true,
          owner: true,
          payload: true,
          attributes: true,
          createdAtBlock: true,
          expiresAtBlock: true,
        })
        .where(...predicates)
        .limit(pageSize);

      if (filter?.createdBy) {
        query = query.createdBy(filter.createdBy as `0x${string}`);
      }
      if (filter?.ownedBy) {
        query = query.ownedBy(filter.ownedBy as `0x${string}`);
      }

      const result = await query.fetch();
      let pagesFetched = 1;

      while (true) {
        if (signal?.aborted) {
          complete = false;
          truncatedReason = "deadline";
          break;
        }

        for (const rawEntity of result.entities) {
          if (seenEntityKeys.has(rawEntity.key)) {
            // Loop detected — break pagination
            complete = true;
            break;
          }
          seenEntityKeys.add(rawEntity.key);

          const normalized = this.normalizeEntity(rawEntity);
          const parsed = parser(normalized);
          if (parsed !== null) {
            items.push(parsed);
          }

          if (items.length >= maxRecords) {
            complete = false;
            truncatedReason = "max_records";
            break;
          }
        }

        if (!complete || items.length >= maxRecords) {
          break;
        }

        if (result.hasNextPage()) {
          if (pagesFetched >= maxPages) {
            complete = false;
            truncatedReason = "max_pages";
            break;
          }
          await result.next();
          pagesFetched++;
        } else {
          break;
        }
      }

      return {
        items,
        complete,
        truncatedReason,
      };
    } catch (error) {
      throw new ArkivQueryUnavailableError(
        `Failed to execute Arkiv query: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }

  async listDependencyEdges(
    filter?: ListDependencyEdgesFilter,
    options?: QueryPaginationOptions,
  ): Promise<BoundedResult<DependencyEdgeRecord>> {
    const project = filter?.project ?? this.projectNamespace;
    const predicates: Predicate[] = [eq("project", project), eq("kind", "dependency_edge")];

    if (filter?.dependent_id) predicates.push(eq("dependent_id", filter.dependent_id));
    if (filter?.dependency_id) predicates.push(eq("dependency_id", filter.dependency_id));
    if (filter?.dependent_type) predicates.push(eq("dependent_type", filter.dependent_type));
    if (filter?.dependency_type) predicates.push(eq("dependency_type", filter.dependency_type));
    if (filter?.protocol_id) predicates.push(eq("protocol_id", filter.protocol_id));
    if (filter?.state) predicates.push(eq("state", filter.state));
    if (filter?.chain_id !== undefined) predicates.push(eq("chain_id", filter.chain_id));

    return this.executePaginatedQuery(predicates, filter, options, (normalized) => {
      const parsed = DependencyEdgeRecordSchema.safeParse(normalized);
      return parsed.success ? parsed.data : null;
    });
  }

  async listHealthAssertions(
    filter?: ListHealthAssertionsFilter,
    options?: QueryPaginationOptions,
  ): Promise<BoundedResult<HealthAssertionRecord>> {
    const project = filter?.project ?? this.projectNamespace;
    const predicates: Predicate[] = [eq("project", project), eq("kind", "health_assertion")];

    if (filter?.dependency_id) predicates.push(eq("dependency_id", filter.dependency_id));
    if (filter?.dependency_type) predicates.push(eq("dependency_type", filter.dependency_type));
    if (filter?.method_id) predicates.push(eq("method_id", filter.method_id));
    if (filter?.state) predicates.push(eq("state", filter.state));
    if (filter?.chain_id !== undefined) predicates.push(eq("chain_id", filter.chain_id));

    return this.executePaginatedQuery(predicates, filter, options, (normalized) => {
      const parsed = HealthAssertionRecordSchema.safeParse(normalized);
      return parsed.success ? parsed.data : null;
    });
  }

  async listMonitorMethods(
    filter?: ListMonitorMethodsFilter,
    options?: QueryPaginationOptions,
  ): Promise<BoundedResult<MonitorMethodRecord>> {
    const project = filter?.project ?? this.projectNamespace;
    const predicates: Predicate[] = [eq("project", project), eq("kind", "monitor_method")];

    if (filter?.method_id) predicates.push(eq("method_id", filter.method_id));
    if (filter?.dependency_type) predicates.push(eq("dependency_type", filter.dependency_type));
    if (filter?.version !== undefined) predicates.push(eq("version", filter.version));

    return this.executePaginatedQuery(predicates, filter, options, (normalized) => {
      const parsed = MonitorMethodRecordSchema.safeParse(normalized);
      return parsed.success ? parsed.data : null;
    });
  }

  async listProtocolResponses(
    filter?: ListProtocolResponsesFilter,
    options?: QueryPaginationOptions,
  ): Promise<BoundedResult<ProtocolResponseRecord>> {
    const project = filter?.project ?? this.projectNamespace;
    const predicates: Predicate[] = [eq("project", project), eq("kind", "protocol_response")];

    if (filter?.protocol_id) predicates.push(eq("protocol_id", filter.protocol_id));
    if (filter?.dependency_id) predicates.push(eq("dependency_id", filter.dependency_id));
    if (filter?.action) predicates.push(eq("action", filter.action));
    if (filter?.chain_id !== undefined) predicates.push(eq("chain_id", filter.chain_id));

    return this.executePaginatedQuery(predicates, filter, options, (normalized) => {
      const parsed = ProtocolResponseRecordSchema.safeParse(normalized);
      return parsed.success ? parsed.data : null;
    });
  }

  async getEntity(key: string): Promise<ArkivEntityRecord | null> {
    try {
      const normalizedKey = (key.startsWith("0x") ? key : `0x${key}`) as `0x${string}`;

      const rawEntity = await this.client.getEntity(normalizedKey);
      if (!rawEntity) return null;

      const normalized = this.normalizeEntity(rawEntity);
      return {
        metadata: normalized.metadata,
        attributes: normalized.attributes,
        payload: normalized.payload,
      };
    } catch (error) {
      throw new ArkivQueryUnavailableError(
        `Failed to get Arkiv entity with key '${key}': ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }
}
