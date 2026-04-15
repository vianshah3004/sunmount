type StatusClass = "2xx" | "3xx" | "4xx" | "5xx";

type RequestMetric = {
  method: string;
  route: string;
  statusCode: number;
  durationMs: number;
};

type Snapshot = {
  uptimeSeconds: number;
  totals: {
    requests: number;
    errors5xx: number;
    errors4xx: number;
    slowRequests: number;
  };
  apdex: {
    thresholdMs: number;
    score: number;
  };
  byRoute: Array<{
    method: string;
    route: string;
    requests: number;
    avgDurationMs: number;
    p95DurationMs: number;
    statusCounts: Record<StatusClass, number>;
  }>;
};

type RouteStats = {
  requests: number;
  totalDurationMs: number;
  durations: number[];
  statusCounts: Record<StatusClass, number>;
};

const MAX_SAMPLES_PER_ROUTE = 400;

class MetricsStore {
  private readonly startedAt = Date.now();
  private readonly routeMap = new Map<string, RouteStats>();
  private totalRequests = 0;
  private total4xx = 0;
  private total5xx = 0;
  private totalSlow = 0;
  private apdexSatisfied = 0;
  private apdexTolerating = 0;

  record(metric: RequestMetric, slowThresholdMs: number) {
    const key = `${metric.method}|${metric.route}`;
    const stats =
      this.routeMap.get(key) ?? {
        requests: 0,
        totalDurationMs: 0,
        durations: [],
        statusCounts: {
          "2xx": 0,
          "3xx": 0,
          "4xx": 0,
          "5xx": 0
        }
      };

    const statusClass = this.toStatusClass(metric.statusCode);

    stats.requests += 1;
    stats.totalDurationMs += metric.durationMs;
    stats.statusCounts[statusClass] += 1;
    stats.durations.push(metric.durationMs);
    if (stats.durations.length > MAX_SAMPLES_PER_ROUTE) {
      stats.durations.shift();
    }

    this.routeMap.set(key, stats);

    this.totalRequests += 1;
    if (statusClass === "4xx") this.total4xx += 1;
    if (statusClass === "5xx") this.total5xx += 1;
    if (metric.durationMs >= slowThresholdMs) {
      this.totalSlow += 1;
    }

    if (metric.durationMs <= slowThresholdMs) {
      this.apdexSatisfied += 1;
    } else if (metric.durationMs <= slowThresholdMs * 4) {
      this.apdexTolerating += 1;
    }
  }

  getSnapshot(apdexThresholdMs: number): Snapshot {
    const byRoute = Array.from(this.routeMap.entries())
      .map(([key, stats]) => {
        const [method, route] = key.split("|");
        return {
          method,
          route,
          requests: stats.requests,
          avgDurationMs: Number((stats.totalDurationMs / Math.max(stats.requests, 1)).toFixed(2)),
          p95DurationMs: this.percentile(stats.durations, 0.95),
          statusCounts: stats.statusCounts
        };
      })
      .sort((a, b) => b.requests - a.requests);

    const apdexDenominator = Math.max(this.totalRequests, 1);
    const apdexScore = Number(((this.apdexSatisfied + this.apdexTolerating / 2) / apdexDenominator).toFixed(4));

    return {
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      totals: {
        requests: this.totalRequests,
        errors5xx: this.total5xx,
        errors4xx: this.total4xx,
        slowRequests: this.totalSlow
      },
      apdex: {
        thresholdMs: apdexThresholdMs,
        score: apdexScore
      },
      byRoute
    };
  }

  toPrometheus(apdexThresholdMs: number): string {
    const snapshot = this.getSnapshot(apdexThresholdMs);
    const lines: string[] = [];

    lines.push("# HELP app_requests_total Total HTTP requests processed.");
    lines.push("# TYPE app_requests_total counter");
    lines.push(`app_requests_total ${snapshot.totals.requests}`);

    lines.push("# HELP app_requests_4xx_total Total HTTP 4xx responses.");
    lines.push("# TYPE app_requests_4xx_total counter");
    lines.push(`app_requests_4xx_total ${snapshot.totals.errors4xx}`);

    lines.push("# HELP app_requests_5xx_total Total HTTP 5xx responses.");
    lines.push("# TYPE app_requests_5xx_total counter");
    lines.push(`app_requests_5xx_total ${snapshot.totals.errors5xx}`);

    lines.push("# HELP app_requests_slow_total Total slow requests above threshold.");
    lines.push("# TYPE app_requests_slow_total counter");
    lines.push(`app_requests_slow_total ${snapshot.totals.slowRequests}`);

    lines.push("# HELP app_apdex_score Apdex score for API request latency.");
    lines.push("# TYPE app_apdex_score gauge");
    lines.push(`app_apdex_score{threshold_ms=\"${snapshot.apdex.thresholdMs}\"} ${snapshot.apdex.score}`);

    for (const route of snapshot.byRoute) {
      const labels = `method=\"${route.method}\",route=\"${route.route.replace(/\"/g, "") }\"`;
      lines.push(`app_route_requests_total{${labels}} ${route.requests}`);
      lines.push(`app_route_latency_avg_ms{${labels}} ${route.avgDurationMs}`);
      lines.push(`app_route_latency_p95_ms{${labels}} ${route.p95DurationMs}`);
      lines.push(`app_route_status_total{${labels},status_class=\"2xx\"} ${route.statusCounts["2xx"]}`);
      lines.push(`app_route_status_total{${labels},status_class=\"3xx\"} ${route.statusCounts["3xx"]}`);
      lines.push(`app_route_status_total{${labels},status_class=\"4xx\"} ${route.statusCounts["4xx"]}`);
      lines.push(`app_route_status_total{${labels},status_class=\"5xx\"} ${route.statusCounts["5xx"]}`);
    }

    return `${lines.join("\n")}\n`;
  }

  private percentile(samples: number[], ratio: number): number {
    if (samples.length === 0) {
      return 0;
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.floor(sorted.length * ratio));
    return Number(sorted[index].toFixed(2));
  }

  private toStatusClass(statusCode: number): StatusClass {
    if (statusCode >= 500) return "5xx";
    if (statusCode >= 400) return "4xx";
    if (statusCode >= 300) return "3xx";
    return "2xx";
  }
}

export const observabilityMetrics = new MetricsStore();
