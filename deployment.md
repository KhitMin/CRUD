
# Project Commands Cheat Sheet (English)

A step-by-step collection of commands from building the project locally to deploying it on an on-premise server.

---

## 1. Local Development (Docker Compose)

### Getting Started

```bash
# Build and run in the background
docker compose up --build -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

---

## 2. GitHub Container Registry (Pushing Images)

### 2.1 Login (Local Machine)

```bash
# Set your GitHub Token as a variable
export GH_TOKEN=your_personal_access_token_here

# Login
echo $GH_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 2.2 Backend Build & Push

```bash
# Build the image
docker build -t ghcr.io/YOUR_USERNAME/crud-backend:latest ./backend

# Push the image
docker push ghcr.io/YOUR_USERNAME/crud-backend:latest
```

### 2.3 Frontend Build & Push

```bash
# Build the image
docker build -t ghcr.io/YOUR_USERNAME/crud-frontend:latest ./frontend

# Push the image
docker push ghcr.io/YOUR_USERNAME/crud-frontend:latest
```

---

## 3. On-Premise Server Deployment

### 3.1 Login on the Server

```bash
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

### 3.2 Pull Images and Run

```bash
# Pull the latest images from the registry
docker compose pull

# Start the containers
docker compose up -d
```

### 3.3 Check Status

```bash
# View running containers
docker compose ps

# View backend logs (Migration/Seed)
docker compose logs -f app
```

---

## 4. Update Workflow (Deploying Changes)

Follow these steps in order whenever there are changes.

### Local Machine

```bash
# 1. Build & Push Again
docker build -t ghcr.io/YOUR_USERNAME/crud-backend:latest ./backend
docker push ghcr.io/YOUR_USERNAME/crud-backend:latest
```

### On-Premise Server

```bash
# 2. Pull & Restart
docker compose pull
docker compose up -d
```

---

## 5. Maintenance Commands

```bash
# Remove unused old images
docker image prune -f

# Access the database for inspection
docker compose exec db psql -U admin -d crud_db
```
---
---

# Project Commands Cheat Sheet

Project ကို Local ၌ Build လုပ်ခြင်းမှသည် On-Premise Server ပေါ်သို့ Deploy လုပ်သည်အထိ အသုံးပြုရမည့် Command များကို အစီအစဉ်တကျ စုစည်းပေးထားပါသည်။

---

## 1. Local Development (Docker Compose)

### စတင် Run ရန်

```bash
# Build လုပ်ပြီး နောက်ကွယ်တွင် Run မည်
docker compose up --build -d

# Log များကို ကြည့်ရန်
docker compose logs -f

# ရပ်တန့်ရန်
docker compose down
```

---

## 2. GitHub Container Registry (Pushing Images)

### 2.1 Login (Local Machine)

```bash
# GitHub Token ကို Variable အဖြစ် သတ်မှတ်ပါ
export GH_TOKEN=your_personal_access_token_here

# Login ဝင်ပါ
echo $GH_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 2.2 Backend Build & Push

```bash
# Image Build လုပ်ခြင်း
docker build -t ghcr.io/YOUR_USERNAME/crud-backend:latest ./backend

# Image Push လုပ်ခြင်း
docker push ghcr.io/YOUR_USERNAME/crud-backend:latest
```

### 2.3 Frontend Build & Push

```bash
# Image Build လုပ်ခြင်း
docker build -t ghcr.io/YOUR_USERNAME/crud-frontend:latest ./frontend

# Image Push လုပ်ခြင်း
docker push ghcr.io/YOUR_USERNAME/crud-frontend:latest
```

---

## 3. On-Premise Server Deployment

### 3.1 Server ပေါ်တွင် Login ဝင်ခြင်း

```bash
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

### 3.2 Images များ ဆွဲချခြင်းနှင့် Run ခြင်း

```bash
# Registry မှ Image အသစ်များကို ဆွဲယူခြင်း
docker compose pull

# Container များကို စတင်ခြင်း
docker compose up -d
```

### 3.3 အခြေအနေ စစ်ဆေးခြင်း

```bash
# Container များ အလုပ်လုပ်ပုံကို ကြည့်ရန်
docker compose ps

# Backend Log (Migration/Seed) ကို ကြည့်ရန်
docker compose logs -f app
```

---

## 4. Update Workflow (အသစ်တင်လိုလျှင်)

အပြောင်းအလဲရှိတိုင်း ဤအဆင့်များကို အစဉ်လိုက် လုပ်ဆောင်ပါ။

### Local Machine

```bash
# 1. Build & Push Again
docker build -t ghcr.io/YOUR_USERNAME/crud-backend:latest ./backend
docker push ghcr.io/YOUR_USERNAME/crud-backend:latest
```

### On-Premise Server

```bash
# 2. Pull & Restart
docker compose pull
docker compose up -d
```

---

## 5. Maintenance Commands

```bash
# မလိုအပ်သော Image အဟောင်းများကို ရှင်းထုတ်ရန်
docker image prune -f

# Database ထဲသို့ ဝင်ရောက်စစ်ဆေးရန်
docker compose exec db psql -U admin -d crud_db
```

