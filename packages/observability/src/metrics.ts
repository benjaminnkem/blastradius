/**
 * Prometheus-compatible metrics registry and recording utilities.
 * Invariant: Avoid high-cardinality labels (e.g. observation IDs, timestamps, or full error strings).
 */

export interface MetricLabels {
  [key: string]: string | number;
}

export class Counter {
  private values = new Map<string, number>();

  constructor(
    readonly name: string,
    readonly help: string,
    readonly labelNames: readonly string[] = [],
  ) {}

  private key(labels: MetricLabels = {}): string {
    return this.labelNames.map((l) => `${l}="${labels[l] ?? ""}"`).join(",");
  }

  inc(labels?: MetricLabels, value: number = 1): void {
    if (value < 0) throw new Error("Counter increments must be non-negative");
    const k = this.key(labels);
    this.values.set(k, (this.values.get(k) ?? 0) + value);
  }

  get(labels?: MetricLabels): number {
    return this.values.get(this.key(labels)) ?? 0;
  }

  toPrometheus(): string {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} counter`];
    for (const [k, val] of this.values.entries()) {
      lines.push(k ? `${this.name}{${k}} ${val}` : `${this.name} ${val}`);
    }
    return lines.join("\n");
  }

  reset(): void {
    this.values.clear();
  }
}

export class Gauge {
  private values = new Map<string, number>();

  constructor(
    readonly name: string,
    readonly help: string,
    readonly labelNames: readonly string[] = [],
  ) {}

  private key(labels: MetricLabels = {}): string {
    return this.labelNames.map((l) => `${l}="${labels[l] ?? ""}"`).join(",");
  }

  set(value: number, labels?: MetricLabels): void {
    this.values.set(this.key(labels), value);
  }

  get(labels?: MetricLabels): number {
    return this.values.get(this.key(labels)) ?? 0;
  }

  toPrometheus(): string {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} gauge`];
    for (const [k, val] of this.values.entries()) {
      lines.push(k ? `${this.name}{${k}} ${val}` : `${this.name} ${val}`);
    }
    return lines.join("\n");
  }

  reset(): void {
    this.values.clear();
  }
}

export class Histogram {
  private counts = new Map<string, number>();
  private sums = new Map<string, number>();
  private bucketCounts = new Map<string, Map<number, number>>();

  constructor(
    readonly name: string,
    readonly help: string,
    readonly labelNames: readonly string[] = [],
    readonly buckets: readonly number[] = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
  ) {}

  private key(labels: MetricLabels = {}): string {
    return this.labelNames.map((l) => `${l}="${labels[l] ?? ""}"`).join(",");
  }

  observe(value: number, labels?: MetricLabels): void {
    const k = this.key(labels);
    this.counts.set(k, (this.counts.get(k) ?? 0) + 1);
    this.sums.set(k, (this.sums.get(k) ?? 0) + value);

    let bMap = this.bucketCounts.get(k);
    if (!bMap) {
      bMap = new Map<number, number>();
      this.bucketCounts.set(k, bMap);
    }

    for (const bucket of this.buckets) {
      if (value <= bucket) {
        bMap.set(bucket, (bMap.get(bucket) ?? 0) + 1);
      }
    }
  }

  toPrometheus(): string {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} histogram`];
    for (const [k, count] of this.counts.entries()) {
      const bMap = this.bucketCounts.get(k) ?? new Map<number, number>();
      const sum = this.sums.get(k) ?? 0;

      let cumulative = 0;
      for (const bucket of this.buckets) {
        cumulative = bMap.get(bucket) ?? cumulative;
        const bucketLabels = k ? `${k},le="${bucket}"` : `le="${bucket}"`;
        lines.push(`${this.name}_bucket{${bucketLabels}} ${cumulative}`);
      }
      const infLabels = k ? `${k},le="+Inf"` : `le="+Inf"`;
      lines.push(`${this.name}_bucket{${infLabels}} ${count}`);
      lines.push(k ? `${this.name}_sum{${k}} ${sum}` : `${this.name}_sum ${sum}`);
      lines.push(k ? `${this.name}_count{${k}} ${count}` : `${this.name}_count ${count}`);
    }
    return lines.join("\n");
  }

  reset(): void {
    this.counts.clear();
    this.sums.clear();
    this.bucketCounts.clear();
  }
}

export class MetricsRegistry {
  private counters = new Map<string, Counter>();
  private gauges = new Map<string, Gauge>();
  private histograms = new Map<string, Histogram>();

  createCounter(name: string, help: string, labelNames: readonly string[] = []): Counter {
    if (this.counters.has(name)) return this.counters.get(name)!;
    const c = new Counter(name, help, labelNames);
    this.counters.set(name, c);
    return c;
  }

  createGauge(name: string, help: string, labelNames: readonly string[] = []): Gauge {
    if (this.gauges.has(name)) return this.gauges.get(name)!;
    const g = new Gauge(name, help, labelNames);
    this.gauges.set(name, g);
    return g;
  }

  createHistogram(
    name: string,
    help: string,
    labelNames: readonly string[] = [],
    buckets?: readonly number[],
  ): Histogram {
    if (this.histograms.has(name)) return this.histograms.get(name)!;
    const h = new Histogram(name, help, labelNames, buckets);
    this.histograms.set(name, h);
    return h;
  }

  toPrometheus(): string {
    const sections: string[] = [];
    for (const c of this.counters.values()) sections.push(c.toPrometheus());
    for (const g of this.gauges.values()) sections.push(g.toPrometheus());
    for (const h of this.histograms.values()) sections.push(h.toPrometheus());
    return sections.join("\n\n") + "\n";
  }

  reset(): void {
    for (const c of this.counters.values()) c.reset();
    for (const g of this.gauges.values()) g.reset();
    for (const h of this.histograms.values()) h.reset();
  }
}

export const defaultMetricsRegistry = new MetricsRegistry();

// Standard metrics defined in technical specification
export const monitorObservationsTotal = defaultMetricsRegistry.createCounter(
  "monitor_observations_total",
  "Total count of observations executed by monitors",
  ["dependency_type", "state"],
);

export const monitorPublicationsTotal = defaultMetricsRegistry.createCounter(
  "monitor_publications_total",
  "Total count of Arkiv entity publications",
  ["kind", "reason"],
);

export const monitorPublicationErrorsTotal = defaultMetricsRegistry.createCounter(
  "monitor_publication_errors_total",
  "Total count of Arkiv publication failures",
  ["kind", "error_code"],
);

export const monitorObservationDurationMs = defaultMetricsRegistry.createHistogram(
  "monitor_observation_duration_ms",
  "Duration of monitor observation cycles in milliseconds",
  ["dependency_type"],
  [50, 100, 250, 500, 1000, 2500, 5000, 10000],
);

export const monitorPublicationDurationMs = defaultMetricsRegistry.createHistogram(
  "monitor_publication_duration_ms",
  "Duration of Arkiv publication transactions in milliseconds",
  ["kind"],
  [100, 500, 1000, 2000, 5000, 10000, 30000],
);
