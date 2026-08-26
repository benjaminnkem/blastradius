export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
  timestamp: number;
}

export interface IncidentSummary {
  dependencyId: string;
  dependencyType: string;
  chainId?: number;
  consensusState: string;
  consensusSeverity: number | null;
  agreement: string;
  activeTrustedCreators: number;
  blastRadius?: {
    root: {
      id: string;
      dependencyType: string;
      healthState: string;
      severity: number | null;
    };
    summary: {
      dependenciesAffected: number;
      protocolsAffected: number;
      operationsAffected: number;
      criticalOperations: number;
    };
    operations: Array<{
      operationId: string;
      protocolId: string;
      operation: string;
      blastScore: number;
      pathCount: number;
      topPaths: string[][];
    }>;
  };
}

export interface IncidentsResponse {
  incidents: IncidentSummary[];
  totalCount: number;
  graphFingerprint: string;
}

export interface DependencyResponse {
  dependencyId: string;
  dependencyType: string;
  consensus: {
    dependencyId: string;
    dependencyType: string;
    aggregateState: string;
    aggregateSeverity: number | null;
    agreement: string;
    coverage: {
      activeTrustedCreators: number;
      expectedTrustedCreators: number;
      minimumRequired: number;
    };
    observations: Array<{
      creator: string;
      publisherId?: string;
      observationId: string;
      state: string;
      severity: number | null;
      confidenceBps: number;
      observedAt: number;
      methodId: string;
      methodVersion: number;
      entityKey: string;
    }>;
  };
  blastRadiusSummary: {
    dependenciesAffected: number;
    protocolsAffected: number;
    operationsAffected: number;
    criticalOperations: number;
  };
  graphFingerprint: string;
}

export interface ProtocolExposureResponse {
  protocolId: string;
  totalOperations: number;
  operations: string[];
  graphFingerprint: string;
}

export interface ArkivProofResponse {
  metadata: {
    key: string;
    creator: string;
    owner: string;
    createdAtBlock: number;
    expiresAtBlock: number;
  };
  attributes: Record<string, unknown>;
  payload: Record<string, unknown>;
}

export interface MethodResponse {
  methodId: string;
  version: number;
  name: string;
  description: string;
  checks: string[];
  thresholds?: Record<string, unknown>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function fetchFromApi<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const envelope = (await res.json()) as ApiEnvelope<T>;
    if (envelope && envelope.success && envelope.data) {
      return envelope.data;
    }

    return null;
  } catch {
    return null;
  }
}

export async function getIncidents(): Promise<IncidentsResponse | null> {
  return fetchFromApi<IncidentsResponse>("/incidents");
}

export async function getDependency(id: string): Promise<DependencyResponse | null> {
  return fetchFromApi<DependencyResponse>(`/dependencies/${encodeURIComponent(id)}`);
}

export async function getProtocolExposure(id: string): Promise<ProtocolExposureResponse | null> {
  return fetchFromApi<ProtocolExposureResponse>(`/protocols/${encodeURIComponent(id)}/exposure`);
}

export async function getProof(key: string): Promise<ArkivProofResponse | null> {
  return fetchFromApi<ArkivProofResponse>(`/proof/${encodeURIComponent(key)}`);
}

export async function getMethod(methodId: string): Promise<MethodResponse | null> {
  return fetchFromApi<MethodResponse>(`/methods/${encodeURIComponent(methodId)}`);
}
