# Anas Portfolio

Personal developer portfolio of **Anas Almehmadi**, served as a Docker container behind Nginx.
It started as a containerization task in the AZEM Technical Internship Program (2.0).
The site is designed as a data platform: each section is a stage of a pipeline.

| Stage | Route | What it shows |
| --- | --- | --- |
| 00 source | `/` | Hero, live "scheduler log", clickable DAG of the site, profile record |
| 01 runs | `/runs` | Experience as a Gantt chart of one long-running DAG run |
| 02 artifacts | `/artifacts`, `/artifacts/:slug` | Filterable project catalog and detail pages |
| 03 lineage | `/lineage?skill=spark` | Skills traced to the roles, projects and certs that used them |
| 04 monitor | `/monitor` | Impact dashboard: reach, Dean's Honor List, certifications |
| 05 query | `/query` | A working mini-SQL console over the portfolio data, plus a contact form |

Press <kbd>`</kbd> on any page to open the console as a drawer. Try `help`, `\dt`, or
`SELECT title FROM projects WHERE stack = 'PostgreSQL'`.

## Tech Stack

- Angular 21 (standalone components, signals, zoneless, lazy routes, view transitions)
- TypeScript, reactive forms, no UI libraries
- Docker multi-stage build
- Nginx

## Project Structure

```
src/app/
  core/
    models/        typed interfaces for every piece of content
    data/          portfolio.data.ts: the single source of truth for all content
    services/      PortfolioService, QueryEngineService (the SQL engine), ConsoleService
  shared/          reusable components (skill chip, count-up, console, glyphs) and the reveal directive
  features/        one folder per route
```

To update the content, edit `src/app/core/data/portfolio.data.ts`. Every page, including the SQL tables, is generated from that file.

## Run Locally

```bash
npm install
npm start
```

Then open [http://localhost:4200/](http://localhost:4200/).

Run the tests:

```bash
npm test
```

## Run with Docker

Build the Docker image:

```bash
docker build -t anas-portfolio .
```

Run the container:

```bash
docker run -d -p 8080:80 --name anas-portfolio anas-portfolio
```

Then open [http://localhost:8080/](http://localhost:8080/).

## Docker Architecture

The application uses a multi-stage Docker build:

1. Node.js installs dependencies and builds the Angular application.
2. The generated files are copied into an Nginx image.
3. Nginx serves the application on port 80 using `nginx.conf`, which:
   - falls back to `index.html` for client-side routes such as `/runs`, so deep links and refreshes work
   - caches content-hashed JS/CSS for a year and always revalidates `index.html`
   - enables gzip

## Docker Hub

Docker image:

`itsanas121/anas-portfolio:latest`
