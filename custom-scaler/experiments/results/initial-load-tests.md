# Initial Autoscaling Experiments

Date: 2026-10-20
Environment: Fedora Linux, Minikube, Kubernetes, Prometheus
Endpoint: POST /api/auth/login
Load generator: hey
Load configuration: 60 seconds, concurrency 5
Responses: HTTP 200

## Experiment A — CPU-only HPA baseline

Total duration: 62.5814 s
Requests completed: 65
Throughput: 1.0386 req/s
Average latency: 4.7861 s
p50 latency: 4.7506 s
p95 latency: 5.1988 s
Maximum latency: 6.3072 s
Autoscaling: HPA enabled, CPU target 50%, min 1, max 5
Observed behavior: HPA scaled up under load and later scaled down.

## Experiment B — Custom autoscaler isolated dry run

Total duration: 62.0077 s
Requests completed: 65
Throughput: 1.0483 req/s
Average latency: 4.7448 s
p50 latency: 4.7103 s
p95 latency: 5.2122 s
Maximum latency: 5.6046 s
Autoscaling: HPA disabled during test; custom autoscaler DRY_RUN=true
Observed behavior: Controller recommended 2 replicas when latency and CPU were high. No actual scaling action occurred.

## Interpretation and limitations

These are preliminary runs, not sufficient evidence to conclude that either approach performs better. The custom autoscaler test was a dry run, so it did not test the performance impact of scaling actions. Repeat controlled trials under the same workload and record raw outputs, controller logs, replica counts, and metric time series before drawing conclusions.

An earlier run showed much higher latency and may have been affected by MongoDB Atlas latency. Do not combine it with these measurements without further investigation.

## Trial A2 — CPU-Based Kubernetes HPA

- Load command: `hey -z 60s -c 5 -m POST` against the authentication login endpoint
- Actual duration: 62.7984 seconds
- Successful requests: 65
- Failed requests: 0
- Throughput: 1.0351 requests/second
- Average latency: 4.8039 seconds
- p50 latency: 4.7572 seconds
- p95 latency: 5.2046 seconds
- Maximum latency: 5.2820 seconds
- HPA CPU target: 50%
- Initial replicas: 1
- Peak replicas observed: 5
- Scale-up observed: 1 -> 4 -> 5
- Replica timeline: `hpa-A2-replica-timeline.csv`
- Final replicas at the exact end of the load test: unknown

This is a second CPU-HPA trial. Results are preliminary and should not be treated as a controlled statistical comparison. The replica timeline covers a longer interval than the load test, so it does not establish the exact replica count at test completion.

## C1 — Custom autoscaler live-scaling trial

- Mode: LIVE_GUARDED
- Load-test command: `hey -z 45s -c 5` against `/api/auth/login`
- Reported duration: 47.6719 seconds
- Successful responses: 48 (HTTP 200)
- Failed responses: 0 reported by `hey`
- Throughput: 1.0069 requests/second
- Average latency: 4.8696 seconds
- p50 latency: 4.8793 seconds
- p95 latency: 5.6977 seconds
- Maximum latency: 6.0072 seconds
- Initial replicas: 1
- Peak replicas: 5
- Verified scale-up sequence: 1 -> 2 -> 3 -> 4 -> 5
- Final replica count at the exact end of the load test: not captured
- Controller-observed p95 reached approximately 8.8 seconds during the run.
- The controller uses a two-minute Prometheus rate window, so controller observations and `hey` latency percentiles are not directly interchangeable.
- Interpretation: the custom autoscaler successfully executed live scale-up actions. This single trial does not establish that it outperforms CPU-based HPA; controlled, repeatable trials are still needed.
