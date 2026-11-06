# Personal website

A React + Bootstrap portfolio and journal with a Spring Boot, Spring Data JPA, and H2 backend. The public site is read-only; the private `/admin` page manages journal posts, attachments, and the printable resume.

## Project documentation

- [Software/System Design Document](./docs/SSD.md) — architecture, requirements, data model, API, and security design.
- [Operations and Support Manual](./docs/OSM.md) — local operation, deployment, health checks, troubleshooting, and backup guidance.

## Run locally

Use Java 17 or newer, Maven, and Node.js.

1. Configure your private admin login and start the API. Use a unique password with at least 12 characters:

   ```sh
   export ADMIN_USERNAME="your-admin-name"
   read -s ADMIN_PASSWORD
   export ADMIN_PASSWORD
   cd backend
   mvn spring-boot:run
   ```

   Enter your password when prompted. Credentials are environment variables and must not be committed.

2. In another terminal, start the public website:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

3. Open the Vite URL printed in the terminal (usually `http://localhost:5173`). The admin is at `/admin`.

Posts and resume details are saved in a local H2 database at `backend/data/`, and uploaded files are stored in `backend/uploads/`. The first API start creates sample journal posts.

## Deploy to Render from GitHub

The included [render.yaml](./render.yaml) and [Dockerfile](./Dockerfile) deploy the React website and Spring Boot API together on Render's free web-service plan. Free services use an ephemeral filesystem: H2 posts and uploaded files can be erased on restart, redeploy, or service sleep. Free services can also sleep while idle and take time to wake up. Upgrade to a paid plan with persistent storage if posts and uploads must survive.

1. **Rotate the admin password.** The password previously shared in chat should be treated as exposed; do not reuse it. Choose a new, unique password of at least 12 characters.
2. Create an **empty GitHub repository** (do not add a README or license; this project already has a README).
3. From this project folder, initialize Git and push the source:

   ```sh
   git init
   git add .
   git commit -m "Prepare personal website for deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```

4. Sign in to Render, choose **New → Blueprint**, connect that GitHub repository, and deploy its `render.yaml`.
5. When Render asks for the unsynced `ADMIN_PASSWORD`, enter your **new** password. The admin username is set to `Admin`. Credentials are private service environment variables; never add passwords to GitHub.
6. Wait for the deployment to become **Live**. Open the `onrender.com` URL Render shows for the service; add `/admin` to sign in and manage posts.

The blueprint sets `SESSION_COOKIE_SECURE=true` for HTTPS. With this free configuration, do not rely on the local H2 database or uploaded files as backups. Uploaded attachments are publicly readable, as they are linked from public journal posts.

### Updating the live site

Push changes to the connected GitHub branch; Render will build and deploy them automatically. Edit profile links in `frontend/src/data.js` and resume content in the admin area before publishing.

## Personalize it

- Update your name, bio, email, and social links in `frontend/src/data.js`.
- Replace the example GitHub links and project descriptions in the same file.
- Edit resume details after signing in at `/admin` and selecting **Resume**. The public `/resume.html` page offers standard templates with and without a photo and a **Print / save PDF** action.
- Update the sample email and profile links before publishing.
- The public portfolio and resume show the frontend application version from `frontend/package.json`.
- For other production hosts, serve the frontend and API on the same origin, use HTTPS, and configure persistent storage for both the database and uploads.

## API

- `GET /api/posts?search=term&sort=newest|oldest|title` — search and sort posts.
- `GET /api/resume` — retrieve the public resume.
- `PUT /api/resume` — admin-only save of resume details and sections.
- `POST /api/auth/login` — authenticate with the configured admin username and password.
- `POST /api/posts`, `PUT /api/posts/{id}`, `DELETE /api/posts/{id}` — admin-only post management.
- `POST /api/uploads` — admin-only upload of a PDF, DOC, DOCX, TXT, MD, PNG, JPG, GIF, or WEBP file (maximum 10 MB).
- `GET /uploads/{filename}` — retrieve an uploaded attachment.
