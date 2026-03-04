# AlertFlow (MRIP) — Microservices Reliability & Incident Platform

## What is it?
MRIP (Microservices Reliability & Incident Platform) is a live service monitoring tool I built and operate at status.priyankbagad.com. It monitors my portfolio projects 24/7, streams DOWN events through Kafka, sends Slack alerts, and displays everything on a real-time React dashboard.

## Elevator pitch
"I built and operate a Microservices Reliability & Incident Platform at status.priyankbagad.com — it monitors my live portfolio and API endpoints, streams incidents via Kafka to Slack, and serves real-time observability data through a GraphQL API built in .NET/C#. Want me to pull it up right now?"

## How it works
- Node.js health checker pings registered URLs every 30 seconds using node-cron
- Records uptime and response times in Supabase PostgreSQL
- On DOWN event → publishes to Confluent Kafka topic (service-health-events)
- Kafka consumer reads event → sends Slack alert to #alerts channel
- React dashboard at status.priyankbagad.com fetches data via GraphQL every 30 seconds
- Redis (Upstash) caches GraphQL responses — 12ms cached vs 150ms uncached

## Tech stack
Frontend: React + Vite (Vercel)
API: .NET 10 + C# + Hot Chocolate GraphQL (Railway)
Health Checker: Node.js + node-cron + kafkajs (Railway)
Database: Supabase PostgreSQL
Cache: Upstash Redis
Events: Confluent Kafka
Alerts: Slack Webhooks
DNS: GoDaddy (status.priyankbagad.com)
Cost: ~$5-10/month total

## Key interview answers

**Why Kafka instead of directly calling Slack?**
Kafka decouples detection from response. If Slack is down, events queue up and process when it recovers. Multiple consumers can react to the same event independently. Adding Discord alerts is just adding another consumer — no changes to the health checker.

**Why Redis?**
Cache-aside pattern — check Redis first, on miss fetch PostgreSQL and populate cache with 5-min TTL. First request 150ms, repeat requests 12ms.

**Why GraphQL over REST?**
Frontend asks for exactly the fields it needs in one request. Reduces over-fetching. Frontend can evolve without waiting for backend changes.

**How do you add a new service?**
Single SQL INSERT into services table. Health checker polls every 30 seconds and automatically picks it up — no code changes, no restarts. Data-driven, not config-driven.

**What is observability?**
Goes beyond monitoring — ability to understand internal state from external outputs. MRIP implements the three pillars: metrics (response times), events (Kafka streams), logs (incident history). Monitoring tells you something is wrong. Observability tells you why.

## Live URL
status.priyankbagad.com

## Timeline
Built March 2026
