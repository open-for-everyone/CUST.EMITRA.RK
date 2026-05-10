# CUST.EMITRA.RK

Modern, mobile-ready eMitra website for **RK** with dynamic center naming, latest updates, and core service highlights.

## Project structure

- `backend/CUST.EMITRA.RK.Api` → .NET 10 backend API
- `/` (root static files) → UI for GitHub Pages

## Run locally

### 1) Run backend (.NET 10)

```bash
dotnet run --project backend/CUST.EMITRA.RK.Api/CUST.EMITRA.RK.Api.csproj
```

By default the API exposes:
- `GET /api/health`
- `GET /api/updates`

### 2) Point UI to local backend

Edit `config.js`:

```js
window.EMITRA_API_BASE_URL = 'http://localhost:5098';
```

Use the URL shown by `dotnet run` (http endpoint).

### 3) Run UI

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Auto deployment with GitHub Actions

### UI → GitHub Pages

Workflow: `.github/workflows/deploy-pages.yml`

- Enable **Pages** in repository settings
- Set source to **GitHub Actions**
- Optional custom domain: add `CNAME` file in repo root with your domain (workflow publishes it automatically)

### Backend → Render

Workflow: `.github/workflows/deploy-render.yml`

1. Create a Render Web Service for `backend/CUST.EMITRA.RK.Api`
2. In Render, create a **Deploy Hook URL**
3. Add GitHub secret: `RENDER_DEPLOY_HOOK_URL`
4. Push to `main` to auto-build in Actions and trigger Render deployment

## Production API URL for UI

After Render service is live, update `config.js`:

```js
window.EMITRA_API_BASE_URL = 'https://your-real-service-name.onrender.com';
```

Then push to `main` to deploy UI to GitHub Pages.
