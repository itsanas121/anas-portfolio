# Dockerized Angular App

A simple Angular application containerized with Docker and served using Nginx.

## Tech Stack

- Angular
- Docker
- Nginx

## Run Locally

Install the dependencies:

```bash
npm install
````

Start the development server:

```bash
npm start
```

Then open:

[http://localhost:4200/](http://localhost:4200/)

## Run with Docker

Build the Docker image:

```bash
docker build -t docker-angular-app .
```

Run the container:

```bash
docker run -d -p 8080:80 --name docker-angular-container docker-angular-app
```

Then open:

[http://localhost:8080/](http://localhost:8080/)

## Docker Architecture

The application uses a multi-stage Docker build:

1. Node.js is used to install dependencies and build the Angular application.
2. The generated Angular files are copied into an Nginx image.
3. Nginx serves the application on port 80.

## Docker Hub

Docker image:

`itsanas121/docker-angular-app:latest`