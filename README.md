# intelliswarm.ai

Marketing site and resume-chat backend for **IntelliSwarm.ai** — the company behind [SwarmAI](https://github.com/intelliswarm-ai/swarm-ai), an open-source Spring AI agentic framework for Java.

## Repository layout

- `website/` — Angular 17 marketing site (prerendered, deployed to AWS S3 + CloudFront)
- `backend/` — Node.js RAG backend for resume chat (Lambda / local)
- `terraform/`, `configuration.tf` — AWS infrastructure as code
- `docker-compose.yml`, `start.sh` — local development orchestration
- `docs/` — supporting documentation

## Technologies

### Frontend (`website/`)
- **Angular 17** with TypeScript and RxJS
- **Bootstrap 5** for layout and components
- **@ngx-translate** for internationalisation
- **Angular Universal / SSR** (`@angular/ssr`, `@angular/platform-server`) with build-time prerendering
- **Express** for the SSR server entrypoint
- Build tooling: Angular CLI, Karma + Jasmine for unit tests

### Backend (`backend/`)
- **Node.js** + **Express** (REST API)
- **LangChain** (`langchain`, `@langchain/community`, `@langchain/ollama`) for RAG orchestration
- **ChromaDB** as the vector store
- **Ollama** for local LLM inference
- **pdf-parse** and **mammoth** for resume document ingestion (PDF / DOCX)
- **AWS SDK v3** — DynamoDB, S3
- Deployable as **AWS Lambda** via **AWS SAM**

### Infrastructure & DevOps
- **AWS** — S3 (static hosting), CloudFront (CDN), Lambda (backend), DynamoDB (telemetry/ledger), ACM (TLS)
  - Primary region: **eu-central-2 (Zurich)**; CloudFront ACM certs in **us-east-1**
- **Terraform** for infrastructure as code
- **Docker** and **docker-compose** for local development
- **GitHub Actions** (`website/.github/workflows/deploy.yml`) for CI/CD
- PowerShell + Bash deploy scripts (`deploy.ps1`, `deploy.sh`, `scripts/s3-deploy.ps1`)

### External integrations
- **Maven Central** — version badge for the SwarmAI framework shown on the home page
- **Sonatype Central** — artifact namespace `ai.intelliswarm`

## Getting started

```bash
# Frontend
cd website
npm install
npm start            # http://localhost:4200

# Backend
cd backend
npm install
npm run dev          # nodemon on server.js

# Full stack via Docker
docker-compose up
```

See `README-Docker.md` for containerised development and `website/DEPLOYMENT_CHECKLIST.md` for release steps.
