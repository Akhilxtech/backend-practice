Before the review: recovery check (do this first, alone)
bash
minikube status
kubectl get pods
kubectl get hpa

If anything looks off (pod not Running, no HPA), run the recovery routine from earlier: check Atlas isn't paused, minikube start if needed, kubectl rollout restart deployment auth-service.

Demo sequence — open 4 terminal tabs

Tab 1 — pods (leave running throughout):

bash
kubectl get pods -w

Tab 2 — HPA (leave running throughout):

bash
kubectl get hpa -w

Tab 3 — get a fresh URL, then sanity-check with one request:

bash
minikube service auth-service --url

Copy the URL, then:

bash
curl -X POST <URL>/api/auth/login -H "Content-Type: application/json" -d '{"email":"akt@gmail.com","password":"12345678"}'

Show this response live — it proves the whole stack (Docker → Kubernetes → MongoDB) is working, before you even touch scaling.

Tab 4 — the actual load test, when you're ready to show scaling:

bash
hey -z 60s -c 50 -m POST -H "Content-Type: application/json" -d '{"email":"akt@gmail.com","password":"12345678"}' <URL>/api/auth/login

While this runs, point at Tabs 1 and 2 — replicas climbing, CPU% spiking then dropping as more pods share load. That live moment is your whole demo.

Optional closer — visual dashboard:

bash
minikube dashboard

   kubectl rollout restart deployment auth-service



   ## Grafana

   username- admin 
   pwd-aYcBTbpUi8wutASPZcbXUh5E3QaLgMtVgZk18dZ9