# 🛠️ Detailed Setup Guide

Welcome to the Edvanta setup guide. This document provides step-by-step instructions to get your development environment up and running.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js**: v20.0 or higher (v22 recommended)
- **npm**: v9.0 or higher
- **Python**: v3.10 or higher
- **pip**: Latest version
- **Git**: For version control

---

## 🏗️ 1. Backend Setup (Flask)

The backend handles AI processing, database communication and business logic.

### Steps:
1.  **Navigate to server directory**:
    ```bash
    cd server
    ```
2.  **Create a virtual environment** (recommended):
    ```bash
    python -m venv venv
    # Windows
    .\venv\Scripts\activate
    # Linux/macOS
    source venv/bin/activate
    ```
3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    pip install -r requirements-dev.txt # For testing
    ```
4.  **Configure environment variables**:
    - Copy `.env.example` to `.env`.
    - Fill in your `MONGODB_URI`, `GEMINI_API_KEY` and Cloudinary variables (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
5.  **Run the server**:
    ```bash
    python app.py
    ```
    The API will be available at `http://localhost:5000`.

---

## 🎨 2. Frontend Setup (React + Vite)

The frontend provides the user interface and interacts with the Flask API.

### Steps:
1.  **Navigate to client directory**:
    ```bash
    cd client
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure environment variables**:
    - Copy `.env.example` to `.env`.
    - Fill in your Firebase configuration and YouTube API key.
    - Set `VITE_API_BASE_URL=http://localhost:5000`.
4.  **Run the development server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

---

## 🧪 3. Running Tests

Edvanta uses **Vitest** for the frontend and **pytest** for the backend.

### Frontend Tests:
```bash
cd client
npm run test        # Run once
npm run test:watch  # Watch mode
```

### Backend Tests:
```bash
cd server
pytest                                          # Run all 63 unit and integration tests
pytest --cov=app --cov-report=term-missing tests/ # Run with coverage report
```

---

## 🔐 4. External Services Setup

### MongoDB Atlas
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user and whitelist your IP.
3. Copy the connection string to your server `.env`.

### Google Gemini AI
1. Get an API key from the [Google AI Studio](https://aistudio.google.com/).
2. Add the key to your server `.env`.

### Firebase (Auth)
1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable Email/Password and Google authentication.
3. Copy the web app config to your client `.env`.

### YouTube API
1. Enable the **YouTube Data API v3** in the [Google Cloud Console](https://console.cloud.google.com/).
2. Create an API Key and add it to your client `.env`.

### Cloudinary (Resume Storage)
1. Sign up for a free account at [Cloudinary](https://cloudinary.com/).
2. Copy your **Cloud Name**, **API Key** and **API Secret** from the dashboard.
3. Add these to your server `.env` as `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`.

---

## 🚀 Deployment

The project is optimized for **Vercel**.

### Backend:
- Vercel automatically detects the `api/index.py` entry point.
- Set environment variables in the Vercel dashboard.

### Frontend:
- Build command: `npm run build`
- Output directory: `dist`
- Set environment variables in the Vercel dashboard.
