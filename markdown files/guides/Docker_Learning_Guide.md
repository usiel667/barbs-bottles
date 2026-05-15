# Docker & Containers: A How-To Learning Guide

## Table of Contents

1. [What is Docker?](#1-what-is-docker)
2. [Core Concepts](#2-core-concepts)
3. [Installation](#3-installation)
4. [Your First Container](#4-your-first-container)
5. [Working with Images](#5-working-with-images)
6. [Writing a Dockerfile](#6-writing-a-dockerfile)
7. [Volumes & Persistent Data](#7-volumes--persistent-data)
8. [Networking](#8-networking)
9. [Docker Compose](#9-docker-compose)
10. [Common Commands Cheat Sheet](#10-common-commands-cheat-sheet)
11. [Next Steps](#11-next-steps)

---

## 1. What is Docker?

Docker is a platform that packages applications and their dependencies into **containers** — lightweight, portable units that run the same way on any machine.

**The problem it solves:** "It works on my machine" — Docker eliminates environment differences between development, staging, and production.

### Containers vs. Virtual Machines

| | Containers | Virtual Machines |
|---|---|---|
| Startup time | Seconds | Minutes |
| Size | MBs | GBs |
| OS | Shares host kernel | Full OS per VM |
| Isolation | Process-level | Hardware-level |
| Use case | Apps & microservices | Full system emulation |

---

## 2. Core Concepts

### Image
A read-only blueprint for a container. Think of it like a class in OOP — it defines what the container will look like but isn't running yet.

### Container
A running instance of an image. You can run many containers from the same image simultaneously.

### Dockerfile
A text file with instructions for building a custom image, step by step.

### Registry
A storage and distribution hub for images. [Docker Hub](https://hub.docker.com) is the public default. You can also run private registries.

### Layer
Each instruction in a Dockerfile creates a cached layer. Docker reuses unchanged layers to make rebuilds fast.

---

## 3. Installation

### macOS / Windows
Download and install **Docker Desktop** from [docker.com](https://www.docker.com/products/docker-desktop). It includes Docker Engine, Docker CLI, and Docker Compose.

### Linux (Ubuntu/Debian)
```bash
# Remove old versions
sudo apt remove docker docker-engine docker.io

# Install Docker
sudo apt update
sudo apt install docker.io

# Start and enable the service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to the docker group (avoid sudo every time)
sudo usermod -aG docker $USER
# Log out and back in for this to take effect
```

### Verify installation
```bash
docker --version
docker run hello-world
```

---

## 4. Your First Container

### Run an interactive Ubuntu container
```bash
docker run -it ubuntu bash
```
- `-i` — interactive (keep stdin open)
- `-t` — allocate a terminal
- `ubuntu` — the image name (pulled from Docker Hub if not local)
- `bash` — the command to run inside

Type `exit` to leave and stop the container.

### Run a web server in the background
```bash
docker run -d -p 8080:80 --name my-nginx nginx
```
- `-d` — detached mode (runs in background)
- `-p 8080:80` — map port 8080 on your machine to port 80 in the container
- `--name my-nginx` — give the container a friendly name

Visit `http://localhost:8080` to see the Nginx welcome page.

### Stop and remove the container
```bash
docker stop my-nginx
docker rm my-nginx
```

---

## 5. Working with Images

### Search for images
```bash
docker search postgres
```

### Pull an image
```bash
docker pull node:20-alpine
```

### List local images
```bash
docker images
```

### Remove an image
```bash
docker rmi node:20-alpine
```

### Image tags
Tags specify the version of an image:
```
node:20-alpine    # Node 20 on Alpine Linux (tiny)
node:20           # Node 20 on Debian
node:latest       # Latest stable (avoid in production — unpredictable)
```

---

## 6. Writing a Dockerfile

A Dockerfile describes how to build your image layer by layer.

### Example: Dockerizing a Node.js app

Project structure:
```
my-app/
├── Dockerfile
├── package.json
├── package-lock.json
└── src/
    └── index.js
```

**Dockerfile:**
```dockerfile
# 1. Start from an official base image
FROM node:20-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy dependency files first (cached layer — only rebuilds when these change)
COPY package*.json ./

# 4. Install dependencies
RUN npm ci --only=production

# 5. Copy the rest of the source code
COPY src/ ./src/

# 6. Expose the port your app listens on (documentation only — doesn't publish it)
EXPOSE 3000

# 7. The command to run when the container starts
CMD ["node", "src/index.js"]
```

### Build the image
```bash
# Run from the directory containing your Dockerfile
docker build -t my-app:1.0 .
```
- `-t my-app:1.0` — tag it with a name and version
- `.` — build context (current directory)

### Run your image
```bash
docker run -d -p 3000:3000 --name my-app my-app:1.0
```

### Key Dockerfile instructions

| Instruction | Purpose |
|---|---|
| `FROM` | Base image to build on |
| `WORKDIR` | Set working directory (creates it if missing) |
| `COPY` | Copy files from host into image |
| `RUN` | Execute a command during build |
| `ENV` | Set environment variables |
| `EXPOSE` | Document which port the app uses |
| `CMD` | Default command when container starts |
| `ENTRYPOINT` | Fixed executable (CMD becomes its arguments) |
| `ARG` | Build-time variable (not available at runtime) |

### .dockerignore
Exclude files from the build context (like `.gitignore`):
```
node_modules
.env
.git
*.log
```

---

## 7. Volumes & Persistent Data

Containers are ephemeral — their filesystem is lost when removed. Volumes solve this.

### Named volume (managed by Docker)
```bash
# Create a volume
docker volume create mydata

# Mount it when running a container
docker run -d \
  -v mydata:/var/lib/postgresql/data \
  --name my-postgres \
  postgres:16
```

### Bind mount (maps a host directory)
Useful in development — changes on your machine reflect instantly in the container:
```bash
docker run -d \
  -v /home/user/myapp:/app \
  -p 3000:3000 \
  my-app:1.0
```

### List and manage volumes
```bash
docker volume ls
docker volume inspect mydata
docker volume rm mydata
```

---

## 8. Networking

### Default bridge network
Containers on the same bridge network can talk to each other by container name.

```bash
# Create a custom network
docker network create my-network

# Run containers on it
docker run -d --network my-network --name db postgres:16
docker run -d --network my-network --name app my-app:1.0
```

The `app` container can now reach the database at hostname `db`.

### Network types

| Type | Use case |
|---|---|
| `bridge` | Default; containers on same host communicate |
| `host` | Container shares host network stack (Linux only) |
| `none` | No networking |
| `overlay` | Multi-host networking (Docker Swarm / Kubernetes) |

### Inspect a network
```bash
docker network ls
docker network inspect my-network
```

---

## 9. Docker Compose

Compose lets you define and run multi-container applications with a single YAML file.

### Example: Web app + database

**docker-compose.yml:**
```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: mydb
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d mydb"]
      interval: 5s
      retries: 5

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://admin:secret@db:5432/mydb
    depends_on:
      db:
        condition: service_healthy

volumes:
  pgdata:
```

### Common Compose commands
```bash
# Start all services (build images if needed)
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Stop and delete volumes too
docker compose down -v

# Rebuild images
docker compose build

# Run a one-off command in a service
docker compose exec app sh
```

---

## 10. Common Commands Cheat Sheet

### Containers
```bash
docker ps                        # List running containers
docker ps -a                     # List all containers (including stopped)
docker stop <name>               # Gracefully stop a container
docker kill <name>               # Force-stop a container
docker rm <name>                 # Remove a stopped container
docker rm -f <name>              # Force-remove a running container
docker logs <name>               # View container logs
docker logs -f <name>            # Follow logs (stream)
docker exec -it <name> sh        # Open a shell in a running container
docker inspect <name>            # Full container details (JSON)
docker stats                     # Live CPU/memory usage
```

### Images
```bash
docker images                    # List local images
docker pull <image>              # Download an image
docker build -t <name> .         # Build an image from Dockerfile
docker rmi <image>               # Remove an image
docker tag <image> <new-tag>     # Tag an image
docker push <image>              # Push to a registry
```

### System cleanup
```bash
docker system prune              # Remove stopped containers, dangling images, unused networks
docker system prune -a           # Also remove unused images
docker volume prune              # Remove unused volumes
```

---

## 11. Next Steps

Once you're comfortable with the basics, explore these topics:

- **Multi-stage builds** — keep production images lean by separating build and runtime stages
- **Docker secrets** — manage sensitive data securely instead of using environment variables
- **Health checks** — let Docker know when your app is truly ready
- **Container registries** — push images to Docker Hub, AWS ECR, or GitHub Container Registry
- **Kubernetes (K8s)** — orchestrate containers at scale across multiple machines
- **Docker Swarm** — Docker's built-in clustering solution (simpler than K8s)

### Recommended resources
- Official docs: [docs.docker.com](https://docs.docker.com)
- Play with Docker (browser sandbox): [labs.play-with-docker.com](https://labs.play-with-docker.com)
- Docker Hub (image registry): [hub.docker.com](https://hub.docker.com)
