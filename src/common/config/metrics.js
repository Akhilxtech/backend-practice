import client from "prom-client";

export const registry = new client.Registry();

client.collectDefaultMetrics({ register: registry });

const requestCounter = new client.Counter({
  name: "auth_http_requests_total",
  help: "Total completed HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [registry],
});

const requestDuration = new client.Histogram({
  name: "auth_http_request_duration_seconds",
  help: "HTTP response duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.2, 0.3, 0.5, 1, 2, 5, 10],
  registers: [registry],
});

export function metricsMiddleware(req, res, next) {
  // Don't count Prometheus scrapes as application traffic.
  if (req.path === "/metrics") {
    return next();
  }

  const startedAt = process.hrtime.bigint();

  res.once("finish", () => {
    const durationSeconds =
      Number(process.hrtime.bigint() - startedAt) / 1e9;

    // Use route templates, not raw URLs containing IDs or query parameters.
    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : "unmatched";

    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    requestCounter.inc(labels);
    requestDuration.observe(labels, durationSeconds);
  });

  next();
}
