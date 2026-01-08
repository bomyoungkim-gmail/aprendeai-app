# Graph Automation Monitoring - Setup Guide

## Overview

This guide explains how to set up monitoring for Graph Automation cron jobs using the built-in Prometheus metrics and Grafana dashboard.

---

## Prerequisites

- Prometheus server (for scraping metrics)
- Grafana instance (for visualization)
- Access to the API server

---

## Step 1: Configure Prometheus

Add the following scrape configuration to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: "graph-automation"
    scrape_interval: 30s
    static_configs:
      - targets: ["api-server:3000"] # Replace with your API server address
    metrics_path: "/metrics/graph"
```

Reload Prometheus configuration:

```bash
curl -X POST http://localhost:9090/-/reload
```

---

## Step 2: Import Grafana Dashboard

1. Open Grafana UI
2. Navigate to **Dashboards** → **Import**
3. Upload the dashboard JSON file:
   ```
   infrastructure/grafana/dashboards/graph-automation.json
   ```
4. Select your Prometheus data source
5. Click **Import**

---

## Step 3: Verify Metrics

### Check Prometheus Targets

1. Open Prometheus UI: `http://localhost:9090/targets`
2. Verify `graph-automation` target is **UP**

### Test Metrics Endpoint

```bash
curl http://localhost:3000/metrics/graph
```

Expected output:

```
# HELP graph_job_duration_ms Job execution duration in milliseconds
# TYPE graph_job_duration_ms summary
graph_job_duration_ms{job="graph-comparison",quantile="0.5"} 12543
...
```

---

## Step 4: Set Up Alerts (Optional)

Create alert rules in Prometheus (`/etc/prometheus/rules/graph-alerts.yml`):

```yaml
groups:
  - name: graph_automation
    interval: 1m
    rules:
      - alert: GraphJobFailed
        expr: graph_job_health < 1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Graph job {{ $labels.job }} is unhealthy"
          description: "Job has been in error/warning state for 5+ minutes"

      - alert: GraphJobMissed
        expr: time() - graph_job_executions_total > 90000 # 25 hours
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Graph job {{ $labels.job }} hasn't run in 25+ hours"
          description: "Daily job may have been skipped"

      - alert: LowGraphConfidence
        expr: graph_average_confidence < 0.5
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Average graph confidence is low"
          description: "Knowledge retention may be degrading"
```

---

## Dashboard Panels Explained

### 1. Job Execution Duration

- **What**: Shows how long jobs take to run (p50, p95, p99)
- **Why**: Detect performance degradation
- **Alert if**: p95 > 30 seconds

### 2. Job Health Status

- **What**: Current health status (0=error, 1=warning, 2=healthy)
- **Why**: Quick visual indicator of job state
- **Alert if**: Status < 2

### 3. Job Success/Failure Rate

- **What**: 5-minute rate of successful vs failed executions
- **Why**: Track reliability trends
- **Alert if**: Failure rate > 10%

### 4. Graph Statistics

- **What**: Total learner graphs and graphs needing comparison
- **Why**: Monitor system load and backlog
- **Alert if**: Needing comparison > 500

### 5. Average Node Confidence

- **What**: Mean confidence score across all graph nodes
- **Why**: Track overall knowledge retention
- **Alert if**: Confidence < 0.5

### 6. Graphs Processed

- **What**: Number of graphs processed in last job run
- **Why**: Verify jobs are processing expected volumes
- **Alert if**: Sudden drop > 50%

---

## Troubleshooting

### Metrics not appearing in Prometheus

1. Check API server logs:

   ```bash
   docker logs api-server | grep GraphMetrics
   ```

2. Verify endpoint is accessible:

   ```bash
   curl -v http://localhost:3000/metrics/graph
   ```

3. Check Prometheus scrape errors:
   ```
   http://localhost:9090/targets
   ```

### Dashboard shows "No Data"

1. Verify Prometheus data source is configured correctly
2. Check time range (default: last 24 hours)
3. Ensure jobs have run at least once (2 AM and 3 AM)

### Jobs showing as "Never Run"

- Jobs run on a cron schedule (2 AM comparison, 3 AM decay)
- Check `/health/graph-automation` endpoint for job status
- Verify cron jobs are enabled in `GraphModule`

---

## API Endpoints

| Endpoint                        | Description               | Format     |
| ------------------------------- | ------------------------- | ---------- |
| `/metrics/graph`                | Prometheus metrics        | text/plain |
| `/health/graph-automation`      | Health check with metrics | JSON       |
| `/health/graph-automation/ping` | Simple ping               | JSON       |

---

## Next Steps

- Set up alerting notifications (Slack, PagerDuty, email)
- Create custom dashboards for specific use cases
- Tune alert thresholds based on production data
- Implement adaptive thresholds (Phase 2)
