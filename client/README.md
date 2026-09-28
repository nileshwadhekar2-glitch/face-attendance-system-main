# Face Attendance System

A biometric attendance tracking application that leverages facial recognition technology to securely log user attendance. This system consists of a React-based frontend for capturing facial data and an Express backend for managing attendance records and user profiles.

## Technologies Used

-   **Frontend**: React (Vite), face-api.js for browser-based facial recognition.
-   **Backend**: Node.js, Express.
-   **Database**: SQLite (via `better-sqlite3`).

## Facial Recognition Models

This project utilizes specific pre-trained models from the `face-api.js` library, located in `client/public/models`. These models are essential for the biometric verification process:

*   **`tiny_face_detector`**: A lightweight, fast, and efficient model designed for real-time face detection in the browser. It balances performance and accuracy, making it suitable for live video feeds.
*   **`face_landmark_68`**: This model detects 68 specific points on a face (jawline, eyebrows, nose, etc.). These landmarks are critical for face alignment, ensuring the face is properly oriented before recognition.
*   **`face_recognition_model`**: A ResNet-34 based architecture that computes a unique 128-dimensional descriptor (embedding) for each face. This descriptor is what distinguishes one individual from another.

## How it works

The system captures facial images and uses the pre-trained models to extract and identify unique facial features. Instead of storing photos, it converts the face into a mathematical descriptor (a list of numbers representing facial features) and saves only that descriptor in the attendance.db SQLite database. This approach is great for privacy, but it means you cannot view the photos of registered users later.

## Prerequisites

Before setting up the frontend, ensure you have the following installed:

-   **Node.js (LTS Version)**: Required for running the Vite development server and installing dependencies.
    -   Download from: [nodejs.org](https://nodejs.org/)
-   **Webcam**: A functional webcam is required for facial recognition.

## Installation and Setup

### Client (Frontend)

1.  Navigate to the client directory:
    ```bash
    cd client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

### Server (Backend)

1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the backend server:
    ```bash
    node index.js
    ```
    *Alternatively, you can use `npx nodemon` for development auto-restarts.*

-   `/server`: Backend API and database logic.

## Useful Links

-   **Library**: [face-api.js on GitHub](https://github.com/justadudewhohacks/face-api.js)
-   **Models**: [face-api.js weights](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)
-   **Documentation**: [face-api.js Documentation](https://justadudewhohacks.github.io/face-api.js/docs/index.html)

## System Capacity & Privacy

-   **Database**: The `attendance.db` is a local SQLite file. Use a tool like [DB Browser for SQLite](https://sqlitebrowser.org/) or the [SQLite Viewer](https://marketplace.visualstudio.com/items?itemName=qwtel.sqlite-viewer) VS Code extension to view it.
-   **Capacity**: The system determines capacity by how many users the **browser** can cross-reference in real-time.
    -   *Efficient*: 1 - 500 users.
    -   *Strain*: 500 - 2,000 users (may increase initial load time).
    -   *Limit*: > 2,000 users may cause significant lag on client devices as every face descriptor is downloaded and matched locally.
-   **Images**: Actual images are **NOT** stored. Only mathematical face descriptors are saved to the database to ensure privacy.

## Adaptive Design & Mobile Optimization

This Face Attendance System has been recently enhanced with an **Adaptive Design** to provide a native app-like experience on any mobile device (iOS and Android), while maintaining a powerful dashboard for desktop users.

### Key Features:
- **Adaptive Layout Architecture**: Automatically switches between a full-featured Desktop Dashboard and a touch-optimized Mobile UI.
- **Native Mobile Enrollment**: A dedicated flow featuring a vertical form and a centered, high-refresh camera viewport.
- **Selfie-Mirror & Square Cropping**: The mobile camera feed is squared (`1:1`) with an intuitive mirror effect (`scaleX(-1)`) for a natural feel.
- **Real-Time AI Feedback**: High-performance green bounding boxes follow faces accurately with zero visual stutter.
- **Privacy-Preserving**: Converts facial landmarks into 128-dimensional mathematical descriptors; no actual photos are stored.
- **Device-Level Security**: Route protection automatically blocks administrative or scanner pages on mobile devices.

## About

The Face Attendance System is a lightweight, privacy-focused biometric solution designed for modern organizations. It is easy to deploy, requires minimal infrastructure, and operates entirely in the browser for maximum accessibility.
