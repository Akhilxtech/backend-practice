#!/usr/bin/env bash
set -u

OUT="$HOME/backend-practice/custom-scaler/experiments/results/raw/replica-timeline-$(date +%Y%m%d-%H%M%S).csv"

mkdir -p "$(dirname "$OUT")"
echo "timestamp,deployment_replicas,ready_replicas,hpa_current_cpu,hpa_target_cpu,pod_status" > "$OUT"

echo "Recording to: $OUT"
echo "Press Ctrl+C to stop."

while true; do
  timestamp=$(date --iso-8601=seconds)

  deployment=$(kubectl get deployment auth-service \
    -o jsonpath='{.status.replicas},{.status.readyReplicas}' 2>/dev/null || echo ",")

  hpa=$(kubectl get hpa auth-service \
    -o jsonpath='{.status.currentMetrics[0].resource.current.averageUtilization},{.spec.metrics[0].resource.target.averageUtilization}' \
    2>/dev/null || echo ",")

  pods=$(kubectl get pods -l app=auth-service \
    --no-headers 2>/dev/null | awk '{print $3}' | paste -sd ';' -)

  echo "$timestamp,$deployment,$hpa,\"$pods\"" >> "$OUT"
  sleep 5
done
