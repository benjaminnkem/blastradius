import { describe, expect, it } from "vitest";
import { StatusTag } from "../components/ui/status-tag";
import { BracketButton } from "../components/ui/bracket-button";
import { MetricBar } from "../components/ui/metric-bar";

describe("Web UI Components", () => {
  it("exports StatusTag and renders properly", () => {
    expect(StatusTag).toBeDefined();
  });

  it("exports BracketButton and renders properly", () => {
    expect(BracketButton).toBeDefined();
  });

  it("exports MetricBar and renders properly", () => {
    expect(MetricBar).toBeDefined();
  });
});
