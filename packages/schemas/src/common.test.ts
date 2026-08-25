import { describe, expect, it } from "vitest";
import {
  BpsSchema,
  ChainIdSchema,
  DependencyTypeSchema,
  EvmAddressSchema,
  HealthStateSchema,
  PositiveVersionSchema,
  ProjectNamespaceSchema,
  PublisherRoleSchema,
  SemanticIdSchema,
  SeveritySchema,
  UnixTimestampSchema,
} from "./common.js";

describe("Primitive Domain Schemas", () => {
  describe("DependencyTypeSchema", () => {
    it("accepts canonical dependency types", () => {
      expect(DependencyTypeSchema.parse("sequencer")).toBe("sequencer");
      expect(DependencyTypeSchema.parse("oracle")).toBe("oracle");
      expect(DependencyTypeSchema.parse("rpc")).toBe("rpc");
      expect(DependencyTypeSchema.parse("operation")).toBe("operation");
    });

    it("rejects unknown dependency types", () => {
      expect(() => DependencyTypeSchema.parse("database")).toThrow();
      expect(() => DependencyTypeSchema.parse("")).toThrow();
    });
  });

  describe("HealthStateSchema", () => {
    it("accepts valid health states", () => {
      expect(HealthStateSchema.parse("healthy")).toBe("healthy");
      expect(HealthStateSchema.parse("degraded")).toBe("degraded");
      expect(HealthStateSchema.parse("critical")).toBe("critical");
      expect(HealthStateSchema.parse("unknown")).toBe("unknown");
      expect(HealthStateSchema.parse("unavailable")).toBe("unavailable");
    });

    it("rejects invalid health states", () => {
      expect(() => HealthStateSchema.parse("ok")).toThrow();
      expect(() => HealthStateSchema.parse("down")).toThrow();
    });
  });

  describe("PublisherRoleSchema", () => {
    it("accepts valid publisher roles", () => {
      expect(PublisherRoleSchema.parse("monitor")).toBe("monitor");
      expect(PublisherRoleSchema.parse("curator")).toBe("curator");
      expect(PublisherRoleSchema.parse("protocol")).toBe("protocol");
    });

    it("rejects invalid roles", () => {
      expect(() => PublisherRoleSchema.parse("admin")).toThrow();
    });
  });

  describe("SemanticIdSchema", () => {
    it("accepts valid semantic IDs", () => {
      expect(SemanticIdSchema.parse("sequencer:base")).toBe("sequencer:base");
      expect(SemanticIdSchema.parse("oracle:chainlink:base:eth-usd")).toBe(
        "oracle:chainlink:base:eth-usd",
      );
      expect(SemanticIdSchema.parse("operation:aave-v3:base:weth-usdc:borrow")).toBe(
        "operation:aave-v3:base:weth-usdc:borrow",
      );
    });

    it("rejects invalid semantic IDs", () => {
      expect(() => SemanticIdSchema.parse("nosegment")).toThrow();
      expect(() => SemanticIdSchema.parse("Sequencer:Base")).toThrow();
      expect(() => SemanticIdSchema.parse("has space:base")).toThrow();
      expect(() => SemanticIdSchema.parse("::invalid")).toThrow();
      expect(() => SemanticIdSchema.parse("")).toThrow();
    });
  });

  describe("EvmAddressSchema", () => {
    it("accepts and normalizes valid EVM addresses to lowercase", () => {
      const mixed = "0x1111111111111111111111111111111111111111";
      const upper = "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
      expect(EvmAddressSchema.parse(mixed)).toBe("0x1111111111111111111111111111111111111111");
      expect(EvmAddressSchema.parse(upper)).toBe("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    });

    it("rejects invalid EVM addresses", () => {
      expect(() => EvmAddressSchema.parse("0x123")).toThrow();
      expect(() => EvmAddressSchema.parse("1111111111111111111111111111111111111111")).toThrow(); // missing 0x
      expect(() => EvmAddressSchema.parse("0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ")).toThrow(); // non-hex
    });
  });

  describe("BpsSchema", () => {
    it("accepts valid basis points (0..10000)", () => {
      expect(BpsSchema.parse(0)).toBe(0);
      expect(BpsSchema.parse(5000)).toBe(5000);
      expect(BpsSchema.parse(10000)).toBe(10000);
    });

    it("rejects out-of-range or non-integer basis points", () => {
      expect(() => BpsSchema.parse(-1)).toThrow();
      expect(() => BpsSchema.parse(10001)).toThrow();
      expect(() => BpsSchema.parse(50.5)).toThrow();
    });
  });

  describe("SeveritySchema", () => {
    it("accepts valid severity values (0..100)", () => {
      expect(SeveritySchema.parse(0)).toBe(0);
      expect(SeveritySchema.parse(50)).toBe(50);
      expect(SeveritySchema.parse(100)).toBe(100);
    });

    it("rejects out-of-range or non-integer severity", () => {
      expect(() => SeveritySchema.parse(-1)).toThrow();
      expect(() => SeveritySchema.parse(101)).toThrow();
      expect(() => SeveritySchema.parse(90.5)).toThrow();
    });
  });

  describe("PositiveVersionSchema", () => {
    it("accepts positive integers", () => {
      expect(PositiveVersionSchema.parse(1)).toBe(1);
      expect(PositiveVersionSchema.parse(42)).toBe(42);
    });

    it("rejects zero, negative, or fractional versions", () => {
      expect(() => PositiveVersionSchema.parse(0)).toThrow();
      expect(() => PositiveVersionSchema.parse(-1)).toThrow();
      expect(() => PositiveVersionSchema.parse(1.5)).toThrow();
    });
  });

  describe("ChainIdSchema", () => {
    it("accepts valid chain IDs", () => {
      expect(ChainIdSchema.parse(1)).toBe(1);
      expect(ChainIdSchema.parse(8453)).toBe(8453);
    });

    it("rejects zero or negative chain IDs", () => {
      expect(() => ChainIdSchema.parse(0)).toThrow();
      expect(() => ChainIdSchema.parse(-8453)).toThrow();
    });
  });

  describe("UnixTimestampSchema", () => {
    it("accepts valid Unix timestamps in seconds", () => {
      expect(UnixTimestampSchema.parse(1787365120)).toBe(1787365120);
    });

    it("rejects impossible timestamps (too old or far future)", () => {
      expect(() => UnixTimestampSchema.parse(0)).toThrow();
      expect(() => UnixTimestampSchema.parse(1000000000)).toThrow(); // 2001
      expect(() => UnixTimestampSchema.parse(3000000000)).toThrow(); // 2065
      expect(() => UnixTimestampSchema.parse(1787365120.5)).toThrow();
    });
  });

  describe("ProjectNamespaceSchema", () => {
    it("accepts valid lowercase alphanumeric project namespaces with hyphens", () => {
      expect(ProjectNamespaceSchema.parse("blastradius-v1")).toBe("blastradius-v1");
      expect(ProjectNamespaceSchema.parse("blastradius-test-1")).toBe("blastradius-test-1");
    });

    it("rejects invalid namespaces (e.g. 0x prefixes, uppercase, spaces)", () => {
      expect(() => ProjectNamespaceSchema.parse("0xabcdef")).toThrow();
      expect(() => ProjectNamespaceSchema.parse("BlastRadius")).toThrow();
      expect(() => ProjectNamespaceSchema.parse("blast radius")).toThrow();
      expect(() => ProjectNamespaceSchema.parse("")).toThrow();
    });
  });
});
