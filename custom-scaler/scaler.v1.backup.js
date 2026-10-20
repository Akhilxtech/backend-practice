import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// Configuration: thresholds are provisional until load testing.
const CONFIG = {
  prometheusUrl: process.env.PROMETHEUS_URL ?? "http://localhost:9090",
  deployment: process.env.DEPLOYMENT_NAME ?? "auth-service",
  namespace: process.env.K8S_NAMESPACE ?? "default",
  minReplicas: Number(process.env.MIN_REPLICAS ?? 1),
  maxReplicas: Number(process.env.MAX_REPLICAS ?? 5),
  rpsPerPodTarget: Number(process.env.RPS_PER_POD_TARGET ?? 20),
  p95TargetSeconds: Number(process.env.P95_TARGET_SECONDS ?? 0.3),
  minimumRpsForLatencyScaleUp: Number(
  process.env.MINIMUM_RPS_FOR_LATENCY_SCALE_UP ?? 0.25
),
  cpuScaleUpPercent: Number(process.env.CPU_SCALE_UP_PERCENT ?? 60),
  cpuScaleDownPercent: Number(process.env.CPU_SCALE_DOWN_PERCENT ?? 30),
  cooldownMs: Number(process.env.COOLDOWN_SECONDS ?? 60) * 1000,
  intervalMs: Number(process.env.INTERVAL_SECONDS ?? 30) * 1000,
  dryRun: process.env.DRY_RUN !== "false",
};

const QUERIES = {
  rps: "sum(rate(auth_http_requests_total[2m]))",
  p95: "histogram_quantile(0.95,sum by (le)(rate(auth_http_request_duration_seconds_bucket[2m])))",
  cpu: '100 * sum by (pod) (rate(container_cpu_usage_seconds_total{namespace="default",pod=~"auth-service-.*",container!="",image!=""}[2m])) / 0.1',
};

let lastScaleRecommendationAt = 0;

async function queryPrometheus(promql) {
  const url = new URL("/api/v1/query", CONFIG.prometheusUrl);
  url.searchParams.set("query", promql);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Prometheus returned HTTP ${response.status}`);
  }

  const body = await response.json();

  if (body.status !== "success") {
    throw new Error("Prometheus query was not successful");
  }

  return body.data.result;
}

async function getScalarMetric(query, name) {
  const result = await queryPrometheus(query);

  if (result.length === 0) {
    throw new Error(`Metric "${name}" is missing`);
  }

  const value = Number(result[0].value[1]);

  if (Number.isNaN(value) && name === "p95 latency") {
    throw new Error(
      'p95 latency is NaN; histogram data is insufficient. Skipping scaling evaluation.'
    );
  }

  if (!Number.isFinite(value)) {
    throw new Error(`Metric "${name}" is not a valid number`);
  }

  return value;
}

async function getP95Latency() {
  const result = await queryPrometheus(QUERIES.p95);

  if (result.length === 0) {
    return null;
  }

  const value = Number(result[0].value[1]);

  // Prometheus returns NaN when the histogram has no observations
  // in the selected time window.
  if (Number.isNaN(value)) {
    return null;
  }

  if (!Number.isFinite(value) || value < 0) {
    throw new Error("p95 latency contains an invalid value");
  }

  return value;
}

async function getCpuMetrics() {
  const result = await queryPrometheus(QUERIES.cpu);

  if (result.length === 0) {
    throw new Error("CPU metrics are missing");
  }

  const values = result.map((item) => Number(item.value[1]));

  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("CPU metrics contain invalid values");
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const maximum = Math.max(...values);

  return {
    averagePercent: average,
    maxPercent: maximum,
    perPodPercent: values,
  };
}


async function getCurrentReplicas() {
  const { stdout } = await execFileAsync("kubectl", [
    "get",
    "deployment",
    CONFIG.deployment,
    "-n",
    CONFIG.namespace,
    "-o",
    "json",
  ]);

  const deployment = JSON.parse(stdout);
  return Number(deployment.spec.replicas ?? 1);
}
async function scaleDeployment(current, desired) {
  if (
    !Number.isInteger(current) ||
    !Number.isInteger(desired) ||
    current < CONFIG.minReplicas ||
    current > CONFIG.maxReplicas ||
    desired < CONFIG.minReplicas ||
    desired > CONFIG.maxReplicas
  ) {
    throw new Error(
      `Unsafe replica update: current=${current}, desired=${desired}, ` +
        `allowed=${CONFIG.minReplicas}-${CONFIG.maxReplicas}`
    );
  }

  console.log(
    `Requesting Kubernetes scale: ${CONFIG.deployment} ` +
      `${current} -> ${desired} replicas`
  );

  const { stdout, stderr } = await execFileAsync(
    "kubectl",
    [
      "scale",
      "deployment",
      CONFIG.deployment,
      "-n",
      CONFIG.namespace,
      `--replicas=${desired}`,
      `--current-replicas=${current}`,
    ],
    { timeout: 15000 }
  );

  if (stdout.trim()) console.log(stdout.trim());
  if (stderr.trim()) console.warn(stderr.trim());

  // Verify that Kubernetes accepted the requested replica count.
  const actual = await getCurrentReplicas();

  if (actual !== desired) {
    throw new Error(
      `Scale verification failed: requested ${desired}, found ${actual}`
    );
  }

  console.log(
    `Scale verified: ${CONFIG.deployment} now requests ${actual} replicas.`
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}


function calculateDesiredReplicas({
  current,
  rps,
  p95,
  maxCpuPercent,
}) {
  const rpsPerPod = rps / Math.max(current, 1);
  const reasons = [];
  let desired = current;

  // Scale up when traffic per pod exceeds the configured target.
  if (rpsPerPod > CONFIG.rpsPerPodTarget) {
    desired = Math.max(
      desired,
      Math.ceil(rps / CONFIG.rpsPerPodTarget),
    );
    reasons.push("RPS per pod exceeds target");
  }

  // Only use latency when it is valid and recent traffic is sufficient.
  if (
    p95 !== null &&
    rps >= CONFIG.minimumRpsForLatencyScaleUp &&
    p95 > CONFIG.p95TargetSeconds
  ) {
    desired = Math.max(desired, current + 1);
    reasons.push("p95 latency exceeds target under traffic");
  }

  // Use the hottest pod, not the average, for scale-up decisions.
  if (maxCpuPercent > CONFIG.cpuScaleUpPercent) {
    desired = Math.max(desired, current + 1);
    reasons.push("Maximum pod CPU utilization exceeds target");
  }

  // Missing p95 must not be interpreted as healthy latency.
  const latencyAllowsScaleDown =
    p95 !== null
      ? p95 < CONFIG.p95TargetSeconds * 0.7
      : rps === 0;

  const safeToScaleDown =
    rpsPerPod < CONFIG.rpsPerPodTarget * 0.5 &&
    latencyAllowsScaleDown &&
    maxCpuPercent < CONFIG.cpuScaleDownPercent;

  if (
    desired === current &&
    current > CONFIG.minReplicas &&
    safeToScaleDown
  ) {
    desired = current - 1;
    reasons.push("All metrics are below scale-down thresholds");
  }

  desired = clamp(
    desired,
    CONFIG.minReplicas,
    CONFIG.maxReplicas,
  );

  if (desired === current) {
    reasons.push("No replica change recommended");
  }

  return { desired, reasons, rpsPerPod };
}


async function evaluate() {
  const [rps, p95, cpu, current] = await Promise.all([
    getScalarMetric(QUERIES.rps, "RPS"),
    getP95Latency(),
    getCpuMetrics(),
    getCurrentReplicas(),
  ]);

  // If meaningful traffic exists but p95 is unavailable,
  // do not make a scaling decision using incomplete telemetry.
  if (rps >= 1 && p95 === null) {
    throw new Error(
      "p95 unavailable under meaningful traffic; skipping evaluation"
    );
  }

const decision = calculateDesiredReplicas({
  current,
  rps,
  p95,
  maxCpuPercent: cpu.maxPercent,
});

  console.log(
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        mode: CONFIG.dryRun ? "DRY_RUN" : "LIVE_GUARDED",
        metrics: {
          rps: Number(rps.toFixed(3)),
          p95Seconds:
            p95 === null ? null : Number(p95.toFixed(3)),
          p95Status:
            p95 === null ? "NO_RECENT_HISTOGRAM_OBSERVATIONS" : "VALID",
          averageCpuPercentOfRequest:
            Number(cpu.averagePercent.toFixed(2)),
          maxCpuPercentOfRequest: Number(cpu.maxPercent.toFixed(2)),
minimumRpsForLatencyScaleUp: CONFIG.minimumRpsForLatencyScaleUp,
          perPodCpuPercentOfRequest: cpu.perPodPercent.map((value) =>
            Number(value.toFixed(2))
          ),
          rpsPerPod: Number(decision.rpsPerPod.toFixed(3)),
        },
        replicas: {
          current,
          recommended: decision.desired,
          min: CONFIG.minReplicas,
          max: CONFIG.maxReplicas,
        },
        reasons: decision.reasons,
      },
      null,
      2
    )
  );
  if (decision.desired === current) return;

  const now = Date.now();

  if (now - lastScaleRecommendationAt < CONFIG.cooldownMs) {
    console.log("Cooldown active; no action taken.");
    return;
  }

  if (CONFIG.dryRun) {
    console.log(
      `[DRY RUN] Would change ${CONFIG.deployment} from ${current} to ${decision.desired} replicas.`
    );

    lastScaleRecommendationAt = now;
    return;
  }

  // Only start the cooldown after a successful live update.
  await scaleDeployment(current, decision.desired);
  lastScaleRecommendationAt = Date.now();
}

async function main() {
  if (
    !Number.isInteger(CONFIG.minReplicas) ||
    !Number.isInteger(CONFIG.maxReplicas) ||
    CONFIG.minReplicas < 1 ||
    CONFIG.maxReplicas < CONFIG.minReplicas
  ) {
    throw new Error("Invalid minimum/maximum replica configuration");
  }

  console.log("Custom autoscaler starting with configuration:", {
    ...CONFIG,
    mode: CONFIG.dryRun ? "DRY_RUN" : "LIVE_GUARDED",
  });

  while (true) {
    try {
      await evaluate();
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Evaluation failed safely:`,
        error.message,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, CONFIG.intervalMs));
  }
}

main().catch((error) => {
  console.error("Fatal startup error:", error);
  process.exitCode = 1;
});
