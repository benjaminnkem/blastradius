import { ArkivReader, createArkivPublicClient } from "@blastradius/arkiv";
import { getArkivRuntimeConfig } from "@blastradius/config";
import type {
  ArkivEntityRecord,
  BoundedResult,
  DependencyEdgeRecord,
  HealthAssertionRecord,
  MonitorMethodRecord,
  ProtocolResponseRecord,
} from "@blastradius/schemas";
import { Injectable, type OnModuleInit } from "@nestjs/common";

@Injectable()
export class ArkivService implements OnModuleInit {
  private reader: ArkivReader | null = null;

  onModuleInit(): void {
    const config = getArkivRuntimeConfig();
    if (config) {
      const publicClient = createArkivPublicClient(config);
      this.reader = new ArkivReader(publicClient, config);
    }
  }

  getReader(): ArkivReader | null {
    return this.reader;
  }

  setReader(reader: ArkivReader | null): void {
    this.reader = reader;
  }

  async listDependencyEdges(): Promise<BoundedResult<DependencyEdgeRecord>> {
    if (!this.reader) {
      return { items: [], complete: true };
    }
    return this.reader.listDependencyEdges();
  }

  async listHealthAssertions(): Promise<BoundedResult<HealthAssertionRecord>> {
    if (!this.reader) {
      return { items: [], complete: true };
    }
    return this.reader.listHealthAssertions();
  }

  async listMonitorMethods(): Promise<BoundedResult<MonitorMethodRecord>> {
    if (!this.reader) {
      return { items: [], complete: true };
    }
    return this.reader.listMonitorMethods();
  }

  async listProtocolResponses(): Promise<BoundedResult<ProtocolResponseRecord>> {
    if (!this.reader) {
      return { items: [], complete: true };
    }
    return this.reader.listProtocolResponses();
  }

  async getEntity(key: string): Promise<ArkivEntityRecord | null> {
    if (!this.reader) {
      return null;
    }
    return this.reader.getEntity(key);
  }
}
