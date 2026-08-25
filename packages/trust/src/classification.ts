import type {
  DependencyType,
  PublisherClassification,
  PublisherRole,
  PublisherScope,
  TrustPolicy,
  TrustPublisher,
} from "@blastradius/schemas";

export interface ScopeCheckTarget {
  dependencyId?: string;
  dependencyType?: DependencyType;
  methodId?: string;
  protocolId?: string;
  chainId?: number;
}

/**
 * Evaluates whether a publisher's scopes permit an action on the given target.
 */
export function isScopePermitted(scopes: PublisherScope, target?: ScopeCheckTarget): boolean {
  if (!target) return true;

  if (scopes.dependencies && scopes.dependencies.length > 0) {
    if (!target.dependencyId || !scopes.dependencies.includes(target.dependencyId)) {
      return false;
    }
  }

  if (scopes.dependencyTypes && scopes.dependencyTypes.length > 0) {
    if (!target.dependencyType || !scopes.dependencyTypes.includes(target.dependencyType)) {
      return false;
    }
  }

  if (scopes.methods && scopes.methods.length > 0) {
    if (!target.methodId || !scopes.methods.includes(target.methodId)) {
      return false;
    }
  }

  if (scopes.protocols && scopes.protocols.length > 0) {
    if (!target.protocolId || !scopes.protocols.includes(target.protocolId)) {
      return false;
    }
  }

  if (scopes.chains && scopes.chains.length > 0) {
    if (target.chainId === undefined || !scopes.chains.includes(target.chainId)) {
      return false;
    }
  }

  return true;
}

/**
 * Classifies an address against a TrustPolicy for a given role and target scope.
 * Invariant: Fail-closed. Any unregistered address, disabled publisher,
 * mismatched role, or unpermitted scope is marked untrusted.
 */
export function classifyPublisher(
  address: string,
  role: PublisherRole,
  target: ScopeCheckTarget | undefined,
  policy: TrustPolicy,
): PublisherClassification {
  const normalizedAddr = address.toLowerCase() as `0x${string}`;

  const publisher: TrustPublisher | undefined = policy.publishers.find(
    (p) => p.address.toLowerCase() === normalizedAddr,
  );

  if (!publisher) {
    return {
      trusted: false,
      address: normalizedAddr,
      roles: [],
      reason: `Address ${normalizedAddr} is not registered in the active trust policy.`,
    };
  }

  if (!publisher.enabled) {
    return {
      trusted: false,
      address: normalizedAddr,
      publisherId: publisher.id,
      roles: publisher.roles,
      reason: `Publisher ${publisher.name ?? publisher.id} (${normalizedAddr}) is disabled in trust policy.`,
    };
  }

  if (!publisher.roles.includes(role)) {
    return {
      trusted: false,
      address: normalizedAddr,
      publisherId: publisher.id,
      roles: publisher.roles,
      reason: `Publisher ${publisher.name ?? publisher.id} has roles [${publisher.roles.join(", ")}], but role '${role}' is required.`,
    };
  }

  if (!isScopePermitted(publisher.scopes, target)) {
    return {
      trusted: false,
      address: normalizedAddr,
      publisherId: publisher.id,
      roles: publisher.roles,
      reason: `Publisher ${publisher.name ?? publisher.id} is not permitted for the requested target scope.`,
    };
  }

  return {
    trusted: true,
    address: normalizedAddr,
    publisherId: publisher.id,
    roles: publisher.roles,
  };
}
