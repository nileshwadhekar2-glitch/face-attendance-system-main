# Face Attendance System

**Local setup for this Mac:** See [RUN-LOCALLY.md](RUN-LOCALLY.md) for startup commands, login, workflow, architecture, and verification limits.

A high-precision biometric attendance application. This system features a React-based client for image capture and a robust Node.js backend for secure facial recognition, JWT authentication, and attendance tracking.

## Technologies Used

-   **Frontend**: React (Vite) - Interfaces with the webcam and renders administration panels.
-   **Backend**: Node.js, Express, JWT, `multer`.
-   **Biometrics**:
    -   **Detection & Recognition**: `face-api.js` (SSD MobileNet V1, 68 Point Face Landmark, ResNet-34 Face Recognition).
    -   **Processing**: Models run directly on the frontend edge, sending only mathematical 128-dimensional Float32 descriptor arrays to the backend for identity verification.
-   **Database**: PostgreSQL.

## Facial Recognition Pipeline

The system processes biometrics securely to minimize server load:
1.  **Capture**: Client captures a webcam frame.
2.  **Detection (Edge)**: Web browser runs `face-api.js` to detect a face, generate bounding boxes, and compute a 128D mathematical descriptor using WebGL/WASM.
3.  **Transmission**: The frontend sends the 128D floating-point array (not the image) to the backend.
4.  **Matching (Backend)**: Server calculates the Euclidean Distance between the incoming array and all stored `face_descriptor` arrays in the PostgreSQL DB.
5.  **Logging**: If Euclidean distance < `0.45`, the face is verified, and the user is logged into the active session.

## Security & Features

- **Strict Session Auto-Termination**: The backend database enforces strict time-based expirations natively. The `Active Session` API strictly checks `start_time + duration`. If expired, it automatically overrides `is_active` to `0` and throws `403 Forbidden` to any incoming biometric requests before they are parsed.
- **JWT Authorization**: Admin panels and endpoints (`/api/admin`, `/api/classes`, `/api/sessions`, `/api/attendance`) are strictly protected via signed JSON Web Tokens (`Authorization: Bearer <token>`).
- **Secure File Exports**: Attendance matrices (Class and Session level) are generated on the server as XLSX buffers. The frontend securely fetches these as `Blob` objects via JWT-authorized headers, rendering native local downloads.
- **Optimized Image Storage**: User photos are compressed and structurally routed to `server/uploads/` rather than bloating the PostgreSQL database via Base64. 

## Prerequisites

Before setting up the project, ensure you have the following installed on your system:

-   **Node.js (LTS Version)**: The system requires Node.js and npm (Node Package Manager).
    -   Download from: [nodejs.org](https://nodejs.org/)
-   **Browser**: A modern web browser (Chrome, Firefox, or Edge) with webcam access enabled.

## Installation and Setup

### 1. Server (Backend)

The backend handles all PostgreSQL queries, JWT logic, and Euclidean Distance comparisons.

1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    npm run dev
    ```
    *Server runs on port 3001 by default.*

### 2. Client (Frontend)

1.  Navigate to the client directory:
    ```bash
    cd client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development interface:
    ```bash
    npm run dev
    ```

## Troubleshooting

-   **"Failed to load models"**: Ensure you have strictly downloaded the `.bin` and `.json` files into `client/public/models/`. Do not right-click "Save As" on Github or you will download HTML corruptions. Use raw links.
-   **"Authentication token missing"**: Ensure you have successfully logged in via `/admin-login`. The token is stored in `localStorage.adminToken`.
-   **"Face not recognized"**: The Euclidean distance threshold is strictly set to `< 0.45`. Try to ensure the room is well-lit and the face is fully visible.


# face-attendance-system-main
