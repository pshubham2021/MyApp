# Operations and Support Manual

## 1. Service overview

| Item | Value |
|---|---|
| Application | Personal portfolio and journal |
| Public URL | `https://shubham-personal-website.onrender.com` |
| Admin URL | `https://shubham-personal-website.onrender.com/admin` |
| Health check | `/api/health` |
| GitHub repository | `https://github.com/pshubham2021/MyApp` |
| Hosting | Render Docker web service, free plan in the current Blueprint |
| Runtime | Java 17; React/Vite frontend built in the Docker image |

The public site and backend API are served from the same origin. Admin credentials are configured in Render's environment settings and must not be stored in this repository.

## 2. Local prerequisites

- Java 17 or newer
- Maven
- Node.js compatible with the project's Vite tooling (Node 22 is used in the Docker build)
- Git

## 3. Run locally

Set a private admin credential in the shell. Do not paste credentials into source files or shell history:

```sh
export ADMIN_USERNAME="your-admin-name"
read -s ADMIN_PASSWORD
export ADMIN_PASSWORD
```

Start the backend from the repository root:

```sh
cd backend
mvn spring-boot:run
```

In a second terminal, start the frontend:

```sh
cd frontend
npm ci
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The admin interface is at `/admin`; the resume is at `/resume.html`. Local H2 data is under `backend/data/`; uploaded files are under `backend/uploads/`. The backend creates sample posts only if the database is empty.

### Build commands

```sh
# Frontend production build
cd frontend
npm ci
npm run build

# Backend package
cd ../backend
mvn clean package
```

The production Docker build performs both builds and packages the compiled frontend in the Spring Boot JAR. `mvn clean package` alone builds the backend and does not run the frontend build.

## 4. Routine administration

1. Browse the public website and check that profile, project, social, and resume links are accurate.
2. Sign in at `/admin` with the username and password configured for the running service.
3. Create or edit a post with a title, excerpt, body, and category.
4. If needed, add an allowed attachment (PDF, DOC, DOCX, TXT, MD, PNG, JPG/JPEG, GIF, or WEBP; maximum 10 MiB). Uploaded files are publicly accessible by design.
5. Preview the public journal after saving. Search and sorting are available to visitors.
6. Delete posts only after confirming the selection; this action cannot be undone through the UI.
7. Select the **Resume** admin tab to edit contact details and standard resume sections. Add a portrait if desired, then save. The portrait is public and appears only in the photo template.
8. Open `/resume.html`, choose **With photo** or **Without photo**, then use **Print / save PDF** and choose a PDF destination in the browser's print dialog.

Update public profile and project details in `frontend/src/data.js`. The application version shown on the portfolio and resume is read from `frontend/package.json`.

## 5. Render deployment and verification

The repository is connected to Render through the root `render.yaml`. A push to the connected branch can trigger a new deploy according to the Render service's auto-deploy setting.

### Deploy a change

1. Make and locally validate the change.
2. Commit and push it to the connected GitHub branch:

   ```sh
   git add <changed-files>
   git commit -m "Describe the change"
   git push origin main
   ```

3. In the Render dashboard, open the `shubham-personal-website` service and review the deploy status and logs.
4. Wait for the deploy to become **Live** and for the health check to pass.
5. Verify the public page, API, and admin route. Do not put credentials in the verification commands or logs.

### Health and smoke checks

```sh
curl -fsS https://shubham-personal-website.onrender.com/api/health
curl -fsS -o /dev/null -w '%{http_code}\n' https://shubham-personal-website.onrender.com/
curl -fsS -o /dev/null -w '%{http_code}\n' https://shubham-personal-website.onrender.com/admin
curl -fsS -o /dev/null -w '%{http_code}\n' https://shubham-personal-website.onrender.com/api/posts
```

Expected: health returns `{"status":"ok"}` and the three page/API checks return HTTP 200. Free services can sleep when idle; allow time for a cold start before treating the first failed request as an outage.

The public resume page should also load `GET /api/resume`; saving the resume requires an authenticated admin session and returns HTTP 401 when called anonymously.

### Environment configuration

| Variable | Required value/handling |
|---|---|
| `ADMIN_USERNAME` | `Admin` in the current Blueprint; change in Render if desired. |
| `ADMIN_PASSWORD` | Set privately in Render. Use a unique password of at least 12 characters. Rotate immediately if exposed. |
| `SESSION_COOKIE_SECURE` | `true` for the HTTPS Render service. |
| `PORT` | Render-managed; do not hardcode a competing port. |
| `DATA_DIR` | Optional H2 parent directory; defaults to `./data`. |
| `UPLOAD_DIR` | Optional uploads directory; defaults to `./uploads`. |

Never commit `.env` files, passwords, session cookies, or uploaded private data. If a password is changed in Render, use the new value at the next login; existing sessions may remain valid until they expire or are invalidated.

## 6. Data durability, backup, and recovery

### Current Render free service

The current Blueprint uses a free web service without a persistent disk. Posts, resume details in H2, and uploaded files are on an ephemeral filesystem and may be erased on restart, redeploy, or other service lifecycle events. Free service instances can also sleep. Treat this hosting configuration as a demo, not as the authoritative copy of important content or files.

There is no automated export or backup job in the application. The admin interface has no restore/import function. Keep independent copies of important post text and attachments. For durable production use, move to storage with a persistent disk or managed database/object storage, configure the application to use that durable storage, and verify backups and restores before relying on it.

### Local backup

Stop the backend before copying the file-based database to obtain a consistent local copy. Back up the entire `backend/data/` directory and `backend/uploads/` directory together. Store copies outside the repository and protect them as private data. Restore by stopping the service, restoring those directories to the configured `DATA_DIR` and `UPLOAD_DIR`, and restarting the backend.

Do not commit database files or uploads to Git; they are excluded by `.gitignore`.

### Recovery after an unsuccessful deploy

1. Open the failed deploy in the Render dashboard and inspect the build and runtime logs.
2. Identify whether the error is in the Docker build, Spring Boot startup, missing environment configuration, or the `/api/health` check.
3. Correct the source or Render environment setting; do not add credentials to logs or source.
4. Redeploy the corrected commit and repeat the health/smoke checks.
5. If the application code is at fault, use Render's dashboard to redeploy a previously known-good commit/deploy. Recheck service configuration after rollback.

Note: rolling back application code does not restore an erased H2 database or uploaded files.

## 7. Troubleshooting

| Symptom | Checks and action |
|---|---|
| First request times out or returns a connection error | A free service may be waking from sleep. Retry after a short wait, then inspect Render service events and logs if it persists. |
| Render deploy remains in progress | Check whether Docker build completed, whether Spring Boot reached startup, and whether `/api/health` passed. A built image alone does not mean the service is live. |
| Health check fails | Review runtime logs for startup/configuration errors and confirm the service is listening on Render's `PORT`. Check that the health path is `/api/health`. |
| Admin login returns 401 | Confirm the configured username/password in Render, verify the password was rotated as intended, and confirm the login request receives a fresh CSRF token. Never share credentials in a support request. |
| Admin mutation returns 401 | The admin session may be missing or expired; sign in again and verify same-origin cookies are enabled. |
| Admin mutation returns 403 | The request may be missing/using a stale CSRF token. Reload the admin page and sign in again. |
| Upload is rejected | Check allowed extension and 10 MiB maximum. The upload directory must be writable and have available disk space. |
| Post or attachment disappeared after restart/deploy | This is expected risk on the current ephemeral free filesystem. Restore only from an independent backup if available; enable durable storage for future data. |
| Public page loads but profile/project links are wrong | Update `frontend/src/data.js`, build, commit, and deploy. These links are placeholders in the starter content. |
| UI/API mismatch after code deploy | Confirm Render is serving the newest successful deploy and hard-refresh the browser to avoid cached assets. |

## 8. Security and support practices

- Share the public URL for visitor testing; share the admin URL only with the administrator.
- Do not send passwords, session cookies, CSRF tokens, database files, or private attachments in issue reports.
- Use a unique admin password with at least 12 characters and rotate it if disclosed.
- Attachments are public. Avoid uploading confidential, personal, or otherwise restricted files.
- Preserve Render logs only as needed for diagnosis; review them for accidental sensitive values before sharing.
- For an incident involving account access, change `ADMIN_PASSWORD` in Render, redeploy/restart as appropriate, and verify login with the new credential.

## 9. Support information to collect

For a reproducible issue, record the UTC time, affected URL/path, expected and actual behavior, HTTP status, Render deploy identifier/commit, and a sanitized relevant log excerpt. Include browser and operating-system details for UI problems. Exclude credentials and personal file contents.
