# CUST.EMITRA.RK

Modern, mobile-ready eMitra website for **RK** — rebuilt with **Angular 20 (standalone architecture)** on the frontend and **.NET 10** on the backend.

Features: component-based Angular UI, latest updates from API, Google Gemini AI chatbot, JWT-secured accounts, activity tracking, and social login (Google/Facebook/LinkedIn).

---

## Project structure

```
/frontend                  ← Angular 20 UI (standalone components)
  src/app                  ← feature/core/shared components and services
  public/config.js         ← Set EMITRA_API_BASE_URL here
  package.json             ← Angular build/test scripts
  Dockerfile               ← Root Dockerfile for Render (repo-root build context)

backend/CUST.EMITRA.RK.Api/
  Program.cs               ← .NET 10 minimal API
  Dockerfile               ← Dockerfile for local docker builds from the api dir
  CUST.EMITRA.RK.Api.csproj
```

---

## Environment variables

### Required on Render (or any Docker host)

| Variable | Description | Example |
|---|---|---|
| `Jwt__Key` | JWT signing secret — **must be ≥ 32 chars** | `your-very-long-random-secret-here` |
| `GEMINI_API_KEY` | Google Gemini AI API key (accepted alongside `GoogleAi__ApiKey`) | `AIza...` |
| `Frontend__BaseUrl` | Frontend URL for secure social auth callback allow-list | `https://your-frontend.example.com` |

### Optional but recommended

| Variable | Description | Default |
|---|---|---|
| `Jwt__Issuer` | JWT issuer claim | `CUST.EMITRA.RK.Api` |
| `Jwt__Audience` | JWT audience claim | `CUST.EMITRA.RK.Client` |
| `ConnectionStrings__DefaultConnection` | SQLite connection string | `Data Source=emitra.db` |
| `GoogleAi__ApiKey` | Alternative name for Gemini API key | *(same as `GEMINI_API_KEY`)* |
| `BackendTeam__WebhookUrl` | Webhook URL for activity notifications | *(none)* |
| `Authentication__Google__ClientId` | Google OAuth client id for social login | *(none)* |
| `Authentication__Google__ClientSecret` | Google OAuth client secret for social login | *(none)* |
| `Authentication__Facebook__AppId` | Facebook app id for social login | *(none)* |
| `Authentication__Facebook__AppSecret` | Facebook app secret for social login | *(none)* |
| `Authentication__LinkedIn__ClientId` | LinkedIn client id for social login | *(none)* |
| `Authentication__LinkedIn__ClientSecret` | LinkedIn client secret for social login | *(none)* |
| `PORT` | Port the API listens on (set automatically by Render) | `10000` |

> **Note on `MONGODB_CONNECTION_STRING`:** The backend currently uses **SQLite**, not MongoDB. The `MONGODB_CONNECTION_STRING` variable is not read by the application. If you want MongoDB support, the data layer would need to be updated.

### .NET-style double-underscore convention

Render environment variables use plain names like `Jwt__Key`. ASP.NET Core automatically maps double-underscore (`__`) to the nested config path (`Jwt:Key`). Both forms below are equivalent:

| Render env var | appsettings.json path |
|---|---|
| `Jwt__Key` | `Jwt → Key` |
| `Jwt__Issuer` | `Jwt → Issuer` |
| `Jwt__Audience` | `Jwt → Audience` |
| `GoogleAi__ApiKey` | `GoogleAi → ApiKey` |
| `BackendTeam__WebhookUrl` | `BackendTeam → WebhookUrl` |
| `ConnectionStrings__DefaultConnection` | `ConnectionStrings → DefaultConnection` |
| `Frontend__BaseUrl` | `Frontend → BaseUrl` |

---

## Run locally

### 1) Backend (.NET 10)

```bash
dotnet run --project backend/CUST.EMITRA.RK.Api/CUST.EMITRA.RK.Api.csproj
```

Endpoints exposed:

- `GET  /api/health`
- `GET  /api/updates`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET  /api/auth/me`
- `POST /api/chat`
- `GET  /api/chat/history`
- `GET  /api/activity`

### 2) Set env vars

```bash
export Jwt__Key="replace-with-a-very-long-random-secret-minimum-32-chars"
export GEMINI_API_KEY="your-google-gemini-api-key"
# optional:
export Jwt__Issuer="CUST.EMITRA.RK.Api"
export Jwt__Audience="CUST.EMITRA.RK.Client"
export BackendTeam__WebhookUrl="https://your-webhook-url"
```

### 3) Point Angular UI to backend

Edit `frontend/public/config.js`:

```js
window.EMITRA_API_BASE_URL = 'http://localhost:5098';
```

### 4) Run Angular UI

```bash
cd frontend
npm install
npm start
# open http://localhost:4200
```

---

## Docker (for Render)

### Build from repo root (Render default)

Render sets the Docker build context to the **repository root**. The root `Dockerfile` handles this correctly:

```bash
docker build -t emitra-api .
```

### Build from the API directory (local dev)

```bash
docker build -t emitra-api ./backend/CUST.EMITRA.RK.Api
```

### Run

```bash
docker run -p 10000:10000 \
  -e Jwt__Key="replace-with-a-very-long-random-secret" \
  -e GEMINI_API_KEY="your-google-gemini-api-key" \
  emitra-api
```

---

## Deploying to Render

1. In Render, create a **Web Service** and connect the `open-for-everyone/CUST.EMITRA.RK` repository.
2. Set **Docker** as the runtime (Render will auto-detect the root `Dockerfile`).
3. Add the following **Environment Variables** in the Render dashboard:

   | Key | Value |
   |---|---|
   | `Jwt__Key` | A random string of ≥ 32 characters |
   | `GEMINI_API_KEY` | Your Google Gemini API key |

4. Click **Deploy**. Render will build the Docker image and start the service.
5. After the service URL is known (e.g. `https://cust-emitra-rk.onrender.com`), update `frontend/public/config.js`:

```js
window.EMITRA_API_BASE_URL = 'https://cust-emitra-rk.onrender.com';
```

6. Push to `main` to auto-deploy the UI to GitHub Pages.

---

## Auto deployment via GitHub Actions

### UI → GitHub Pages

Workflow: `.github/workflows/deploy-pages.yml`

- Enable **Pages** in repository settings → source: **GitHub Actions**
- Push to `main` (touching any UI file) triggers automatic deployment

### Backend → Render

Backend deployment is managed directly in Render using the repository root `Dockerfile`.
