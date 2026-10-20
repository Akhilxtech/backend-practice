to check logs 

kubectl logs deployment/auth-service


# BE Major Project — GKE Autoscaling Demonstration

**Project:** Workload-Aware Autoscaling for a Node.js Authentication Microservice  
**Baseline:** Kubernetes CPU-based Horizontal Pod Autoscaler (HPA)  
**Proposed approach:** Custom autoscaler using RPS, p95 latency, and CPU utilization

---

## Important Rules

- Keep the GKE cluster, application deployment, and monitoring resources running until the final presentation is over.
- Never run the baseline HPA and custom autoscaler simultaneously against the same deployment.
- Use the same load-test command for both experiments.
- Record baseline and custom results separately.
- Do not recreate the cluster or deployment for the demonstration.

## Terminal Setup

| Terminal | Purpose |
|---|---|
| Terminal 1 | HPA monitoring / deployment monitoring |
| Terminal 2 | Pod monitoring |
| Terminal 3 | Application port-forward |
| Terminal 4 | Load testing |
| Terminal 5 | Custom autoscaler or monitoring port-forward |

You can reuse a terminal after stopping its previous command with `Ctrl+C`.

---

# Phase 1 — Verify the GKE Environment

Run these commands one at a time.

### 1. Check the active cluster

```bash
kubectl config current-context
```

Confirm that it refers to `auth-autoscaler-gke`.

### 2. Check the nodes

```bash
kubectl get nodes
```

Expected: node status `Ready`.

### 3. Check the deployment

```bash
kubectl get deployment auth-service
```

Confirm that the desired and ready replica counts are healthy.

### 4. Check pods

```bash
kubectl get pods -o wide
```

Confirm the application pods are `Running` and ready.

### 5. Check the service

```bash
kubectl get svc auth-service
```

### 6. Check CPU metrics

```bash
kubectl top pods
```

If this fails, resolve the metrics issue before relying on CPU-based HPA scaling.

---

# Phase 2 — Configure the Baseline HPA

### 1. Check whether an HPA already exists

```bash
kubectl get hpa
```

If `auth-service` exists, inspect it:

```bash
kubectl describe hpa auth-service
```

If it already has a CPU target of 50%, minimum replicas 1, and maximum replicas 5, keep it and skip the creation steps.

### 2. Create the HPA configuration

Run only if no HPA exists. This creates `hpa-baseline.yaml` in your current directory.

```bash
cat <<'EOF' > hpa-baseline.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service
  namespace: default
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  minReplicas: 1
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 50
EOF
```

Apply the configuration:

```bash
kubectl apply -f hpa-baseline.yaml
```

Verify:

```bash
kubectl describe hpa auth-service
```

Check the CPU target, minimum and maximum replicas, current metrics, and Events.

If CPU utilization displays `<unknown>`, investigate before continuing.

---

# Phase 3 — Prepare Monitoring Terminals

### Terminal 1 — Watch HPA

```bash
kubectl get hpa auth-service -w
```

Keep it open during the baseline test.

### Terminal 2 — Watch pods

```bash
kubectl get pods -w
```

This shows pod creation and readiness changes.

**Note:** Avoid `kubectl get hpa,pods -w`; use separate watch commands.

### Terminal 3 — Start the application port-forward

Run only if it is not already active:

```bash
kubectl port-forward svc/auth-service 8081:8080
```

Keep this terminal open.

The local application URL is:

`http://127.0.0.1:8081`

Login endpoint:

`http://127.0.0.1:8081/api/auth/login`

If you see `address already in use`, check whether the port-forward is already running.

---

# Phase 4 — Run the Baseline Load Test

Use Terminal 4.

```bash
hey -z 60s -c 5 -m POST \
  -H "Content-Type: application/json" \
  -d '{"email":"akt@gmail.com","password":"12345678"}' \
  http://127.0.0.1:8081/api/auth/login
```

Test settings:

- Duration: 60 seconds
- Concurrency: 5
- Request: POST login endpoint

While the test runs, show:

- Terminal 1: HPA CPU target and replica count
- Terminal 2: pod status and readiness
- Grafana: RPS, p95 latency, CPU, and ready replicas

**Important:** HPA is not guaranteed to reach five replicas. Scaling depends on CPU utilization, metric availability, and the workload.

---

# Phase 5 — Record Baseline Results

After `hey` finishes, stop the watch commands with `Ctrl+C`.

### HPA status

```bash
kubectl get hpa auth-service
```

### HPA details and events

```bash
kubectl describe hpa auth-service
```

### Deployment replica count

```bash
kubectl get deployment auth-service
```

### Pod status

```bash
kubectl get pods -o wide
```

### CPU and memory

```bash
kubectl top pods
```

Save the `hey` output. Record the throughput, average latency, p95 latency, response count, and replica changes.

If HPA did not scale, use the CPU target and Events to explain why.

---

# Phase 6 — Open Grafana and Prometheus

## Grafana

Run only if its port-forward is not already active:

```bash
kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80
```

Open:

`http://localhost:3000`

Select the dashboard:

**Auth Service Autoscaling - GKE Monitoring**

Check these panels if available:

- Requests per second (RPS)
- p95 response latency
- CPU utilization
- Ready replicas

If a panel is empty, verify its query and time range. Check replica counts directly with:

```bash
kubectl get hpa auth-service
kubectl get deployment auth-service
```

## Prometheus (optional)

Run only if its port-forward is not already active:

```bash
kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 9091:9090
```

Open:

`http://localhost:9091`

---

# Phase 7 — Switch to the Custom Autoscaler

**Do this only after recording the baseline results.**

### 1. Stop the baseline watch commands

Press `Ctrl+C` in the HPA and pod watch terminals.

### 2. Verify the baseline HPA

```bash
kubectl get hpa
kubectl describe hpa auth-service
```

If `auth-service` is the HPA created for the baseline and you intend to switch controllers, remove that HPA object:

```bash
kubectl delete hpa auth-service
```

This removes the HPA object, not the application deployment. Do not delete the deployment.

### 3. Start the custom autoscaler

Run in a separate terminal:

```bash
cd ~/backend-practice

DRY_RUN=false \
INTERVAL_SECONDS=10 \
SCALE_UP_COOLDOWN_SECONDS=20 \
SCALE_DOWN_COOLDOWN_SECONDS=60 \
SCALE_DOWN_STABILIZATION_SECONDS=90 \
node custom-scaler/scaler.js
```

Keep the terminal open. Show the panel the controller's metrics, decisions, cooldown messages, and scaling actions.

### 4. Watch replica changes

In another terminal:

```bash
kubectl get deployment auth-service -w
```

### 5. Run the same load test

```bash
hey -z 60s -c 5 -m POST \
  -H "Content-Type: application/json" \
  -d '{"email":"akt@gmail.com","password":"12345678"}' \
  http://127.0.0.1:8081/api/auth/login
```

### 6. Wait for scale-down stabilization

After the load test, allow time for the 90-second stabilization period and cooldowns. Scaling down may not happen immediately.

Check the final state:

```bash
kubectl get deployment auth-service
kubectl get pods -o wide
kubectl top pods
```

Save the custom controller logs and load-test output separately from the baseline.

---

# Phase 8 — Check MongoDB Connection Logs

### Recent application logs

```bash
kubectl logs deployment/auth-service --tail=100
```

### Filter for MongoDB and connection errors

```bash
kubectl logs deployment/auth-service --tail=200 | grep -iE 'mongo|connected|database|error|failed'
```

### Watch logs live

```bash
kubectl logs -f deployment/auth-service
```

Look for your application's MongoDB connection-success message and any database connection errors. Exact message wording depends on your logging code.

---

# Phase 9 — Get Application URLs

## Local application URL

Make sure the port-forward is active:

```bash
kubectl port-forward svc/auth-service 8081:8080
```

Base URL:

`http://127.0.0.1:8081`

Login endpoint:

`http://127.0.0.1:8081/api/auth/login`

## Inspect the service

```bash
kubectl get svc auth-service
```

Check whether an external IP is assigned:

```bash
kubectl get svc auth-service \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}{"\n"}'
```

If the output is empty and the service is `ClusterIP`, it has no public external IP. A node's external IP alone is not necessarily a working application URL; public access requires a suitably configured external service or ingress.

## Check node addresses

```bash
kubectl get nodes -o wide
```

---

# Phase 10 — Final Verification

```bash
kubectl config current-context
kubectl get nodes
kubectl get deployment auth-service
kubectl get pods -o wide
kubectl get svc auth-service
kubectl get hpa
kubectl top pods
```

---

# Panel Presentation Checklist

- [ ] Correct GKE context and healthy node
- [ ] Application deployment and pods are ready
- [ ] CPU metrics are available
- [ ] HPA target is 50%, minimum 1 and maximum 5
- [ ] Application port-forward works
- [ ] Grafana dashboard opens
- [ ] Custom autoscaler is stopped during baseline testing
- [ ] Baseline load-test output is saved
- [ ] Baseline replica changes are recorded
- [ ] Baseline HPA is removed before starting the custom controller, if applicable
- [ ] Custom controller logs are visible during the custom test
- [ ] Same load-test settings are used for both tests
- [ ] Custom load-test output and replica changes are recorded separately

---

# Important Reminders

1. Run baseline and custom experiments separately.
2. Use identical request, duration, and concurrency settings for a fairer comparison.
3. CPU HPA scaling depends on actual CPU utilization and metric availability.
4. Treat one run as a demonstration, not conclusive statistical proof.
5. Do not delete or stop the GKE cluster, application deployment, or monitoring resources before the final presentation is over.
