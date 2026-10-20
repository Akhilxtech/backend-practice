import csv
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
CSV_PATH = ROOT / "experiments/gke/gke-comparison.csv"
OUT_DIR = ROOT / "experiments/gke/graphs"
OUT_DIR.mkdir(parents=True, exist_ok=True)

TRIALS = {
    "GKE-HPA-01": "CPU-based HPA",
    "GKE-CUSTOM-V2": "Custom RPS + p95 + CPU",
}

METRICS = [
    ("throughput_rps", "Throughput (requests/second)",
     "throughput_comparison.png", 3),
    ("avg_latency_seconds", "Average latency (seconds)",
     "average_latency_comparison.png", 3),
    ("p95_latency_seconds", "p95 latency (seconds)",
     "p95_latency_comparison.png", 3),
    ("max_latency_seconds", "Maximum latency (seconds)",
     "maximum_latency_comparison.png", 3),
]

with CSV_PATH.open(newline="", encoding="utf-8") as file:
    rows = {row["trial_id"]: row for row in csv.DictReader(file)}

missing = [trial for trial in TRIALS if trial not in rows]
if missing:
    raise SystemExit(f"Missing required experiment IDs in CSV: {missing}")

labels = list(TRIALS.values())
selected = [rows[trial] for trial in TRIALS]

plt.rcParams.update({
    "font.family": "serif",
    "font.size": 10,
    "axes.titlesize": 12,
    "axes.labelsize": 10,
    "figure.dpi": 120,
    "savefig.dpi": 300,
})

def draw_bars(ax, values, ylabel, title, decimals=3):
    x = np.arange(len(labels))
    bars = ax.bar(x, values, width=0.55, edgecolor="black", linewidth=0.7)
    ax.set_xticks(x, labels)
    ax.set_ylabel(ylabel)
    ax.set_title(title, pad=10)
    ax.grid(axis="y", linestyle="--", alpha=0.35)
    ax.set_axisbelow(True)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.bar_label(bars, fmt=f"%.{decimals}f", padding=4, fontsize=9)
    ax.margins(y=0.18)

for key, ylabel, filename, decimals in METRICS:
    values = [float(row[key]) for row in selected]
    fig, ax = plt.subplots(figsize=(6.4, 4.0), constrained_layout=True)
    draw_bars(ax, values, ylabel, ylabel, decimals)
    fig.savefig(OUT_DIR / filename, bbox_inches="tight")
    plt.close(fig)

fig, axes = plt.subplots(2, 2, figsize=(10, 7), constrained_layout=True)
for ax, (key, ylabel, _, decimals) in zip(axes.flat, METRICS):
    values = [float(row[key]) for row in selected]
    draw_bars(ax, values, ylabel, ylabel, decimals)

fig.suptitle(
    "GKE Autoscaler Performance Comparison\n"
    "Single-run descriptive results; concurrency = 5",
    fontsize=13,
)
fig.savefig(OUT_DIR / "performance_comparison.png", bbox_inches="tight")
plt.close(fig)

print("Graphs generated from the CSV measurements:")
for path in sorted(OUT_DIR.glob("*.png")):
    print(f"  {path.relative_to(ROOT)}")
print("\nNote: These are descriptive single-run comparisons, not controlled causal evidence.")
