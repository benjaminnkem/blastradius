import { describe, expect, it } from "vitest";
import { ConfigError } from "./env.js";
import {
  loadDependencyDeclaration,
  loadMonitorMethodDeclaration,
  loadMonitorTargets,
  loadTrustPolicy,
} from "./loaders.js";

describe("Config Loaders", () => {
  describe("loadTrustPolicy", () => {
    it("parses valid YAML trust policy", () => {
      const yamlContent = `
version: 1
policyId: blastradius-trust-v1
publishers:
  - id: monitor-base-a
    name: "Base Monitor Node A"
    address: "0x1111111111111111111111111111111111111111"
    roles: [monitor]
    scopes:
      dependencies:
        - "sequencer:base"
    enabled: true
`;
      const policy = loadTrustPolicy(yamlContent);
      expect(policy.version).toBe(1);
      expect(policy.publishers.length).toBe(1);
      expect(policy.publishers[0]?.address).toBe("0x1111111111111111111111111111111111111111");
    });

    it("rejects malformed YAML or invalid schema", () => {
      expect(() => loadTrustPolicy(":::not valid yaml")).toThrow(ConfigError);
      expect(() =>
        loadTrustPolicy(`
version: 0
policyId: test
publishers: []
`),
      ).toThrow(ConfigError);
    });
  });

  describe("loadMonitorTargets", () => {
    it("parses valid YAML monitor targets list", () => {
      const yamlContent = `
version: 1
targets:
  - type: sequencer
    targetId: base-sequencer
    dependencyId: "sequencer:base"
    chainId: 8453
    rpcUrls:
      - "https://mainnet.base.org"
  - type: oracle
    targetId: base-eth-usd
    dependencyId: "oracle:chainlink:base:eth-usd"
    chainId: 8453
    feedAddress: "0x71041dddad3595f9cef3dccf156597b71c782d68"
    heartbeatSec: 3600
    rpcUrls:
      - "https://mainnet.base.org"
`;
      const targets = loadMonitorTargets(yamlContent);
      expect(targets.length).toBe(2);
      expect(targets[0]?.type).toBe("sequencer");
      expect(targets[1]?.type).toBe("oracle");
    });
  });

  describe("loadDependencyDeclaration", () => {
    it("parses valid YAML dependency declaration", () => {
      const yamlContent = `
schemaVersion: 1
edgeId: "aave-borrow->chainlink-eth-usd"
dependent:
  id: "operation:aave-v3:base:weth:borrow"
  type: operation
dependency:
  id: "oracle:chainlink:base:eth-usd"
  type: oracle
criticalityBps: 9500
propagationBps: 10000
evidence:
  - type: official_docs
    url: "https://docs.aave.com"
    description: "Official docs reference"
`;
      const decl = loadDependencyDeclaration(yamlContent);
      expect(decl.edgeId).toBe("aave-borrow->chainlink-eth-usd");
      expect(decl.criticalityBps).toBe(9500);
    });
  });

  describe("loadMonitorMethodDeclaration", () => {
    it("parses valid YAML monitor method declaration", () => {
      const yamlContent = `
schemaVersion: 1
methodId: "sequencer-health-v1"
dependencyType: sequencer
name: "Sequencer health monitor"
description: "Checks head progression"
checks:
  - "safe head lag"
thresholds:
  warningLagSec: 120
`;
      const method = loadMonitorMethodDeclaration(yamlContent);
      expect(method.methodId).toBe("sequencer-health-v1");
      expect(method.checks).toEqual(["safe head lag"]);
    });
  });
});
