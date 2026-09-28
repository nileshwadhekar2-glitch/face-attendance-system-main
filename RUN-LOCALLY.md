# Run and use FaceAttend on this Mac

## Open the app

Visit http://localhost:5173 in a desktop browser. Use a window wider than 1024 pixels: the existing responsive design hides the Lecturer and Scanner pages on smaller windows. A narrow Codex preview shows enrollment only.

Lecturer login: **admin** / **admin123**. These are local development credentials in `server/.env`.

## Daily workflow

1. Open **Lecturer**, sign in, and create a class with a name and unique code.
2. Open **Enroll**, enter student details, and select the class. Allow camera access in your browser. Follow the two capture prompts and submit enrollment.
3. Return to **Lecturer** and create a session for that class. Select check-in or check-out and a duration in minutes (0 means no expiry).
4. Open **Scanner**. The student looks into the webcam; the server checks their face against enrolled students and verifies class membership.
5. View attendance logs and session statistics in the lecturer dashboard. Export Records downloads an Excel file; class/session matrix exports show attendance across sessions.

The same student cannot create another record for the same session and check-in/check-out type. The student must be enrolled in the session's class.

## Restart after stopping the app or rebooting

From Terminal:

```sh
cd /Users/nileshsmac/Downloads/face-attendance-system-main
./scripts/start-local.sh
```

This starts the project-local PostgreSQL instance if necessary, the API at http://localhost:3001, and Vite at http://localhost:5173. Stop the frontend/backend with Ctrl+C in that terminal. Do not run a second copy while those ports are already in use.

To stop the database separately:

```sh
/opt/homebrew/opt/postgresql@17/bin/pg_ctl -D .local/postgres stop
```

The script assumes the database already initialized for this Mac and dependencies already installed. The database lives in `.local/postgres`, listens only on 127.0.0.1:5433, and uses the local `faceattend` role. Photos are stored in `server/uploads`. Preserve both directories to keep your data.

## How the code works

- `client/src/App.jsx`: React routes, navigation and admin page wrapper.
- `client/src/pages/Register.jsx` and `MobileEnroll.jsx`: collect student details and webcam captures. Face-api.js models in `client/public/models` compute a 128-number face descriptor in the browser. The current UI captures two photos but submits only the first capture's descriptor.
- `client/src/pages/Attendance.jsx`: scans a webcam frame and sends its descriptor to the API.
- `client/src/api/index.js`: HTTP requests, admin token headers and Excel downloads. Vite proxies `/api` and `/uploads` to port 3001.
- `server/index.js`: Express API and static files; waits for database schema initialization before listening.
- `server/src/services/faceService.js`: compares descriptors using Euclidean distance. The closest match is accepted only below 0.45; the displayed confidence is a distance-derived score, not a calibrated probability.
- `server/src/services/sessionService.js`: active sessions and duration expiry checks.
- `server/src/services/attendanceService.js`: attendance records, duplicate checks, logs and matrices.
- `server/src/config/database.js`: PostgreSQL connection and table creation. Tables are users, classes, enrollments, sessions and attendance.

Local enrollment sends the descriptor and photo to this Mac's server. `PHOTO_STORAGE=local` compresses and stores the photo locally; it does not require a Cloudinary account. Cloudinary remains available if configured and local storage is not selected.

## Verification and limits

`cd server && node smoke-test.js` tests the local API with synthetic descriptors and an artificial image. Run it only with no active session; it removes its own records afterward. It verifies login protection, classes, enrollment/photo storage, matching, duplicate scans, unknown-face rejection, session statistics and Excel exports. This does not measure real face recognition accuracy or camera access.

For a real camera check, enroll yourself and scan once, then scan again to check the duplicate message. Use good light and a clear face view. Camera permission must be granted by you in your browser.

This is configured for local development. The dependency install reported known vulnerabilities, and the project accepts browser-supplied descriptors; it is not a verified liveness/anti-spoofing system. Production deployment needs a separate security review and dependency updates.
