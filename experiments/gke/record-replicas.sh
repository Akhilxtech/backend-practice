#!/usr/bin/env bash
set -u

MODE="${1:?Usage: ./record-replicas.sh hpa|custom}"
OUT="experiments/gke/${MODE}-synchronized-replicas.csv"

echo "timestamp,elapsed_seconds,desired_replicas,ready_replicas" > "$OUT"
START="$(date +%s)"

echo "Recording $MODE replica timeline to $OUT"
echo "Press Ctrl+C to stop recording."

while true; do
  NOW="$(date +%s)"
  ELAPSED=$((NOW - START))

  VALUES="$(kubectl get deployment auth-service \
    -o jsonpath='{.spec.replicas},{.status.readyReplicas}' 2>/dev/null || true)"

  DESIRED="$(printf '%s' "$VALUES" | cut -d, -f1)"
  READY="$(printf '%s' "$VALUES" | cut -d, -f2)"

  DESIRED="${DESIRED:-0}"
  READY="${READY:-0}"

  printf '%s,%s,%s,%s\n' \
    "$(date --iso-8601=seconds)" "$ELAPSED" "$DESIRED" "$READY" >> "$OUT"

  sleep 1
done
