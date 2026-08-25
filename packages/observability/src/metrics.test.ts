import { describe, expect, it } from "vitest";
import { Counter, Gauge, Histogram, MetricsRegistry } from "./metrics.js";

describe("Observability Metrics", () => {
  it("increments counter with labels and formats Prometheus text", () => {
    const counter = new Counter("test_counter_total", "Test counter help", ["state"]);
    counter.inc({ state: "degraded" }, 3);
    counter.inc({ state: "degraded" }, 2);
    counter.inc({ state: "healthy" }, 1);

    expect(counter.get({ state: "degraded" })).toBe(5);
    expect(counter.get({ state: "healthy" })).toBe(1);

    const prom = counter.toPrometheus();
    expect(prom).toContain('test_counter_total{state="degraded"} 5');
    expect(prom).toContain('test_counter_total{state="healthy"} 1');
  });

  it("sets gauge values correctly", () => {
    const gauge = new Gauge("test_gauge", "Test gauge help", ["dependency"]);
    gauge.set(42, { dependency: "sequencer:base" });
    expect(gauge.get({ dependency: "sequencer:base" })).toBe(42);

    const prom = gauge.toPrometheus();
    expect(prom).toContain('test_gauge{dependency="sequencer:base"} 42');
  });

  it("records histogram observations across buckets", () => {
    const hist = new Histogram("test_latency_ms", "Latency help", [], [10, 50, 100]);
    hist.observe(5);
    hist.observe(25);
    hist.observe(75);
    hist.observe(150);

    const prom = hist.toPrometheus();
    expect(prom).toContain('test_latency_ms_bucket{le="10"} 1');
    expect(prom).toContain('test_latency_ms_bucket{le="50"} 2');
    expect(prom).toContain('test_latency_ms_bucket{le="100"} 3');
    expect(prom).toContain('test_latency_ms_bucket{le="+Inf"} 4');
    expect(prom).toContain("test_latency_ms_count 4");
    expect(prom).toContain("test_latency_ms_sum 255");
  });

  it("exports all metrics via MetricsRegistry", () => {
    const reg = new MetricsRegistry();
    const c = reg.createCounter("reg_counter", "help");
    c.inc();
    const prom = reg.toPrometheus();
    expect(prom).toContain("reg_counter 1");
  });
});
