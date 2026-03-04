# JiffyJobs — Community Micro-Job Marketplace

## What is it?
JiffyJobs is a neighborhood-driven two-sided marketplace where people can post and complete micro-jobs like furniture assembly, pet sitting, and moving help. Think TaskRabbit but hyper-local, lower fees, and built with modern architecture. Built as a team project at Northeastern with a 5-person team.

## My specific role
I owned: Project Setup, Authentication Modules, Payment Module (Stripe), and CI/CD Workflow. These were the most technically complex pieces of the project.

## What we built
- Full two-sided marketplace: task posters and helpers
- Competitive bidding system — helpers place bids, posters review and assign
- Real-time chat powered by Socket.IO
- Escrow-based payments using Stripe Connect — funds held until task completion verified
- Two-sided ratings and reviews after task completion
- Admin moderation panel for disputes and identity verification
- Map-based task discovery using Leaflet API
- Automated email notifications via Resend
- AWS S3 for task photo uploads

## Tech stack
Frontend: React 18 + TypeScript + Vite + MUI + React Leaflet
Backend: Node.js + Express + TypeScript + Prisma ORM + PostgreSQL
Payments: Stripe Connect
Real-time: Socket.IO
DevOps: Docker + GitHub Actions CI/CD
Hosting: Render (backend) + Vercel (frontend)

## Hardest challenge
CI/CD was my first time setting up a full pipeline. The GitHub Actions workflow had to handle TypeScript builds, run Jest/Supertest tests, generate Prisma client, and auto-deploy to Render with DB migrations. Getting all those pieces to work reliably under a deadline was genuinely hard — I learned by doing, reading docs, and debugging late nights.

## Sprint stats
5 sprints, 1 week each, 46 stories, 126 story points total. Daily standups, sprint planning, reviews, and retrospectives.

## What I learned
Leadership means trusting your team, not doing everything yourself. Early on I tried to control too much. When I delegated properly and played to each person's strengths, we shipped faster and built better.

## Timeline
September 2025 — December 2025
