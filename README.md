<div align="center">
	<img src="assets/edvanta-logo.png" alt="Edvanta" height="90" />
</div>

# Edvanta
**AI-powered personalised learning & career acceleration platform**

A comprehensive full-stack educational platform that revolutionizes learning through artificial intelligence, offering personalized learning tools, beautiful responsive design and seamless deployment across any platform.

<!-- Project badges -->
[![License](https://img.shields.io/badge/License-MIT-green.svg)](docs/LICENSE) [![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](client/package.json) [![Deploy](https://img.shields.io/badge/deploy-vercel-brightgreen.svg)](https://vercel.com)

## 🌟 Key Features

### **AI-Powered Learning Ecosystem**
- 🤖 **Intelligent Doubt Solver** - Context-aware chatbot with quick starter prompts, code syntax highlighting with copy-code feedback and an integrated Text-to-Speech (TTS) speech reader.
- 📝 **Smart Quiz System** - AI-generated personalized quizzes with automatic scoring, instant review and history logs.
- 👨‍🏫 **AI Tutor** - Voice-enabled interactive conversational tutor with customizable speech synthesis (pitch slider, rate slider, system voices dropdown) and a pulsating audio wave recording visualizer.
- 🗺️ **Learning Roadmaps** - Personalized career learning paths with interactive milestone tracking (completion checkboxes), progress bar cards and persistent server-side MongoDB syncing.
- 🎬 **Visual Content Explorer** - YouTube API integration for educational video discovery and embed previews.
- 📄 **Resume Analyzer** - AI-powered resume feedback, scoring and job role mapping with Cloudinary-backed PDF/TXT uploads, featuring a custom animated ATS Score circular gauge chart.

### **Modern React Application**
- 📱 **Responsive Design** - Mobile-first interface optimized for all screen sizes and devices.
- ⚡ **Lightning Fast** - Powered by Vite build system with fast hot-reloading (HMR).
- 🎨 **Premium Light Mode Design** - Refined, modern corporate educational theme with clean typography (Poppins/Inter), soft cards, elegant glassmorphic components and elevation shadows. Locked to Light Mode to maximize visual accessibility.
- 🔥 **Hot Reload** - Instant development feedback with Vite HMR.
- 🌙 **Screen Fatigue Prevention** - Smart break reminders with customizable timer reset.
- 🌐 **Basic PWA** - Offline support with network status alerts and background sync queueing.

### **Universal Deployment**
- 🌐 **Platform Agnostic** - Fully compatible with Vercel serverless, AWS, Railway, Render, or local setups.
- 🚀 **Serverless Ready** - Optimized backend routing and modular Python handlers.
- 📦 **Zero Configuration** - Auto-resolves development vs production endpoints.
- 🛡️ **Production Grade** - Secure API keys, input validation and structured error boundaries.
- 🔌 **Offline Access** - Cached assets and local storage integration for resilient usability.

## 🏗️ Architecture Overview

```mermaid
graph TB
    subgraph "Frontend (React App)"
        A[React App] --> B[Firebase Auth]
        A --> C[TailwindCSS UI]
        A --> D[Vite Build System]
        C --> E[Radix UI Components]
    end
    
    subgraph "Backend (Flask API)"
        F[Flask Server] --> G[AI Services]
        F --> H[Database]
        I[External APIs]
        G --> J[Google Gemini]
        H --> K[MongoDB]
        P[YouTube API] --> Q[Video Discovery]
    end
    
    A -.-> F
    D -.-> F
    A -.-> P
```

**Client (React App)** ↔ **REST API (Flask)** ↔ **AI Services (Gemini, MongoDB)**

## 🎯 Feature Showcase

Edvanta provides a suite of AI-powered tools designed to make learning more interactive and personalized.

| Feature | Description | Interactive Capabilities | Status |
|---------|-------------|--------------------------|--------|
| **Intelligent Chatbot** | Doubt solving with session history | Quick starters, Code copy, Text-to-Speech (TTS) | ✅ 10/10 Active |
| **AI Tutor** | Conversational tutor | Speech Rate/Pitch, Custom Voices, Audio Recording Wave | ✅ 10/10 Active |
| **Smart Quiz System** | AI-generated quizzes & evaluation | Automatic grading, Interactive selection, History | ✅ 10/10 Active |
| **Learning Roadmaps** | Personalized learning paths | Milestone checkboxes, Progress percentage bars, DB Sync | ✅ 10/10 Active |
| **Visual Content Explorer** | YouTube video explorer | Video search, Modal player embed | ✅ 10/10 Active |
| **Resume Analyzer** | AI-powered resume scanning | File upload, Animated ATS Score circular gauge, Job mapping | ✅ 10/10 Active |
| **Screen Fatigue** | Eye strain prevention | Smart notifications, Break reminders | ✅ 10/10 Active |

## 📁 Project Structure

```
edvanta/
├── assets/                          # Global static assets (logo, branding images)
├── docs/                            # Project documentation (Setup, Contributing, License)
│   ├── CONTRIBUTING.md              # Rules and guidelines for contributors
│   ├── LICENSE                      # Open-source license terms
│   ├── SETUP.md                     # Step-by-step developer setup instructions
│   └── VIDEO_DEMO.md                # Video walkthrough script and checklist
├── client/                          # React + Vite Frontend Application
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Layout/              # Navigation (Navbar, Sidebar)
│   │   │   └── ui/                  # Design system components
│   │   │       ├── badge.jsx, button.jsx, card.jsx, input.jsx
│   │   │       ├── progress.jsx, tabs.jsx
│   │   │       ├── HeroSpline.jsx   # 3D hero section
│   │   │       ├── ScreenFatigueReminder.jsx # Break reminder system
│   │   │       ├── PageTransition.jsx # Smooth page transitions
│   │   │       ├── ScrollToTop.jsx  # Auto-scroll component
│   │   │       ├── OfflineIndicator.jsx # Network status indicator
│   │   │       └── custom-css/      # Custom CSS modules
│   │   ├── pages/                   # Route-based page components
│   │   │   ├── Home.jsx, Dashboard.jsx
│   │   │   ├── auth/                # Login, Signup
│   │   │   └── tools/               # AI learning tools
│   │   │       ├── ConversationalTutor.jsx # AI tutoring system
│   │   │       ├── DoubtSolving.jsx # AI chatbot for Q&A
│   │   │       ├── Quizzes.jsx     # Quiz generation & scoring
│   │   │       ├── Roadmap.jsx     # Learning path generator
│   │   │       ├── VisualContent.jsx # YouTube API video explorer
│   │   │       └── ResumeAnalysis.jsx # AI-powered resume analysis
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.js, useResponsive.js, helper.js
│   │   └── lib/                     # Core utilities & testing
│   │       ├── api.js               # Centralized API client & useAPICall hook
│   │       ├── offlineStorage.js    # IndexedDB/localStorage offline sync engine
│   │       ├── firebase.js          # Firebase configuration
│   │       ├── utils.js             # Helper functions
│   │       └── *.test.js            # Vitest unit test suites
│   ├── public/                      # Static assets (manifest.json, icons)
│   ├── package.json, vite.config.ts, tailwind.config.js
│   └── .env.example                 # Environment template with full docs
└── server/                          # Flask Backend API
    ├── api/
    │   └── index.py                 # Vercel WSGI entry point
    ├── app/
    │   ├── __init__.py              # Application factory & CORS middleware
    │   ├── config.py                # Environment configuration
    │   ├── middleware/              # Auth & validation decorators
    │   ├── routes/                  # Modular Blueprint route handlers
    │   │   ├── chatbot.py, quizzes.py, tutor.py
    │   │   ├── roadmap.py, user_stats.py, resume.py, videos.py
    │   └── utils/                   # Service integrations
    │       ├── ai_utils.py          # Gemini AI integration
    │       ├── mongo_utils.py, quizzes_utils.py
    ├── app.py                       # Local development entry point
    ├── requirements.txt, runtime.txt, vercel.json
    └── .env.example                 # Environment template with full docs
```

## 🚀 Quick Start

### Quick start (under 5 minutes)
If you want to get the app running locally quickly, this 2–5 minute flow will get both client and server started:

```bash
git clone https://github.com/tanish-jain-225/edvanta.git
cd edvanta
# start backend (in one terminal)
cd server && pip install -r requirements.txt && cp .env.example .env && python app.py
# start frontend (in another terminal)
cd client && npm install && cp .env.example .env && npm run dev
```

The detailed step-by-step Quick Start is below this short guide.

### Prerequisites
- **Node.js 18.0+** (for frontend)
- **Python 3.10+** (for backend)
- **MongoDB Atlas** account (database)
- **Google Gemini API** key (AI features)
- **Firebase** project (authentication)
- **YouTube Data API v3** key (visual content explorer)

### 🖥️ Local Development

#### 1. Clone Repository
```bash
git clone https://github.com/tanish-jain-225/edvanta.git
cd edvanta
```

#### 2. Setup Backend
```bash
cd server
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials (see server/.env.example for detailed setup)
python app.py
```
Backend runs at: `http://localhost:5000`

#### 3. Setup Frontend
```bash
cd client
npm install
cp .env.example .env
# Edit .env with your credentials (see Frontend Configuration)
npm run dev
```
Frontend runs at: `http://localhost:5173`

### 🌐 Production Deployment

#### Vercel (Recommended) - ✅ READY
Both frontend and backend are **production-ready** for Vercel deployment:

**Backend:**
```bash
cd server
# Ensure all environment variables are configured
vercel --prod
```

**Frontend:**
```bash
cd client
# Ensure all environment variables are configured
vercel --prod
```

**Deployment Requirements:**
- ✅ Vercel configurations ready (`vercel.json`)
- ✅ Environment variables properly structured
- ✅ Dependencies optimized for serverless
- ✅ Build scripts validated

#### Other Platforms
The application auto-detects deployment environment and works on:
- **AWS Lambda** / **Netlify** / **Google Cloud** / **Heroku** / **Railway**


## ⚙️ Configuration

All environment variables are fully documented in `.env.example` files with setup guides.

### 🔧 Backend Configuration (`server/.env`)

**Required:** MongoDB URI, Gemini API Key  
**Optional:** Secret Key, CORS settings

See `server/.env.example` for:
- Detailed setup instructions for each service
- Multiple naming convention support
- Troubleshooting guides
- Platform-specific deployment notes

### 🎨 Frontend Configuration (`client/.env`)

**Required:** Firebase (6 vars), Backend URLs (2 vars), YouTube API  
**Optional:** Environment override

See `client/.env.example` for:
- Step-by-step Firebase setup
- YouTube API key generation
- Development vs production mode

## 🔧 API Endpoints

### Core Services
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check & environment info |
| `GET` | `/api/runtime-features` | Feature availability status |
| `GET` | `/api/health` | Simple health check status |

### AI Doubt Solving Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat/message` | Send chat message to AI chatbot |
| `GET` | `/api/chat/loadChat` | Load all chat sessions for a user |
| `POST` | `/api/chat/createChat` | Create a new chat session |
| `PUT` | `/api/chat/updateMessages/{session_id}/messages` | Update messages inside a chat session |
| `DELETE` | `/api/chat/deleteChat/{session_id}` | Delete a chat session |
| `PATCH` | `/api/chat/updateActivity/{session_id}/activity` | Update the last activity timestamp |
| `POST` | `/api/chat` | Legacy single-message chatbot fallback endpoint |
| `GET` | `/api/chat/history/{user_email}` | Legacy chat history retrieval |

### AI Quizzes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/quizzes/generate` | Generate AI quiz from topic |
| `POST` | `/api/quizzes/submit` | Submit quiz answers for evaluation |
| `GET` | `/api/tools/quizzes` | List saved quizzes for a user |
| `POST` | `/api/tools/quizzes` | Save a quiz to database |
| `DELETE` | `/api/tools/quizzes/{quiz_id}` | Delete a saved quiz with ownership verification |
| `GET` | `/api/quiz-history` | Get quiz completion history |
| `POST` | `/api/quiz-history` | Log quiz completion to history |
| `DELETE` | `/api/quiz-history` | Clear quiz history for a user |

### AI Tutor
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tutor/ask` | Ask AI tutor a question |
| `POST` | `/api/tutor/session/start` | Start tutor session with voice-aware init |
| `POST` | `/api/tutor/session/end` | End active tutor session |
| `GET` | `/api/tutor/session/active` | Get active tutor session status |
| `POST` | `/api/tutor/voice/toggle` | Enable/disable voice response output |
| `GET` | `/api/tutor/voice/connection` | Check voice connection status |
| `POST` | `/api/tutor/voice/optimize` | Optimize text response for voice |
| `GET` | `/api/tutor/chat/history` | Get pagination/filtered chat history |
| `POST` | `/api/tutor/chat/clear` | Clear chat history for user |
| `GET` | `/api/tutor/health` | Tutor health check |

### Learning Roadmaps
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/roadmap/generate` | Generate roadmap from goal/background |
| `GET` | `/api/roadmap/user` | Get all roadmaps for a user (`?user_email=...`) |
| `GET` | `/api/roadmap/{roadmap_id}` | Get specific roadmap details |
| `PUT` | `/api/roadmap/{roadmap_id}` | Update roadmap milestones/progress |
| `DELETE` | `/api/roadmap/{roadmap_id}` | Delete a roadmap |
| `GET` | `/api/roadmap/download/{roadmap_id}` | Download roadmap as a PDF |

### User Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user-stats` | Get user progress statistics (`?user_email=...`) |
| `POST` | `/api/user-stats/session` | Record user session activity |
| `GET` | `/api/user-stats/test` | User stats health and test endpoint |

### Resume Analyzer
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/resume/analyze` | Upload resume (PDF/TXT) to Cloudinary and get Gemini AI feedback & analysis |
| `GET` | `/api/resume/history` | Retrieve user resume analysis history |
| `DELETE` | `/api/resume/history/{id}` | Delete specific resume analysis record |

### Visual Content
| Method | Endpoint / Implementation | Description |
|--------|---------------------------|-------------|
| `GET` | `/api/videos/search` | Backend YouTube search proxy (`?q=...&max_results=...`) |
| Client | Direct YouTube API v3 | Client-side video search fallback via `VITE_YOUTUBE_API_KEY` |
| Client | Embedded iframe | Video player modal preview |

## 🛠️ Technology Stack

<!-- Tech badges -->
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=white)](https://reactjs.org) [![Vite](https://img.shields.io/badge/Vite-6.4.2-646cff?logo=vite&logoColor=white)](https://vitejs.dev) [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.3.0-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com) [![Flask](https://img.shields.io/badge/Flask-3.1.1-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com) [![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python&logoColor=white)](https://python.org) [![MongoDB](https://img.shields.io/badge/MongoDB-atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)ct-18.3.1-61DAFB?logo=react&logoColor=white)](https://reactjs.org) [![Vite](https://img.shields.io/badge/Vite-6.3.5-646cff?logo=vite&logoColor=white)](https://vitejs.dev) [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.12-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com) [![Flask](https://img.shields.io/badge/Flask-3.1.1-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com) [![Python](https://img.shields.io/badge/Python-3.10-blue?logo=python&logoColor=white)](https://python.org) [![MongoDB](https://img.shields.io/badge/MongoDB-atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)


### 🎨 Frontend Stack
- **React 18.3.1** - Modern React with hooks, Suspense and concurrent features
- **Vite 6.4.2** - Next-generation frontend build tool with HMR
- **React Router DOM 7.8.0** - Declarative routing with nested route support
- **TailwindCSS 4.3.0** - Utility-first CSS framework with Vite plugin
- **Radix UI Components** - Accessible, unstyled component primitives
- **Lucide React 0.539.0** - Beautiful, customizable icon library
- **Firebase 12.1.0** - Authentication and Firestore database
- **Axios 1.11.0** - Promise-based HTTP client with specialized API client
- **Vitest 4.1.6** - Fast unit and component test runner with happy-dom

### ⚙️ Backend Stack
- **Flask 3.1.1** - Lightweight web framework
- **Google Generative AI** - Gemini API integration
- **PyMongo 4.6.1** - MongoDB driver

### 🗄️ External Services
- **Google Gemini** - AI content generation
- **MongoDB Atlas** - Cloud database
- **Firebase** - Authentication and real-time database
- **YouTube Data API v3** - Educational video search and discovery
- **Vercel** - Serverless deployment platform

## 🎨 Modern React Features

### 🚀 Performance & Development
- **Vite Build System** - Lightning-fast development with HMR
- **Code Splitting** - Route-based lazy loading for optimal performance
- **Tree Shaking** - Optimized production builds with unused code elimination
- **Modern Bundling** - Efficient JavaScript chunks and asset optimization
- **Service Worker** - Intelligent caching for offline-first experience

### 📱 Progressive Web App
- **Offline Support** - Full functionality without internet connection
- **Background Sync** - Automatic data synchronization when online
- **Service Worker** - Intelligent caching for offline-first experience

### 📱 User Experience
- **Responsive Design** - Mobile-first approach with TailwindCSS breakpoints
- **Smooth Transitions** - Page transitions and loading states
- **Screen Fatigue Prevention** - Smart break reminders with timer reset functionality
- **Error Boundaries** - Graceful error handling with user-friendly messages
- **Offline Indicator** - Real-time network status notifications

### ⚡ Interactive Features
- **Real-time Feedback** - Live validation and instant UI updates
- **Form Optimization** - Debounced inputs and real-time validation
- **Progressive Enhancement** - Core functionality works without JavaScript

## 🔐 Security Features

### 🛡️ Authentication & Authorization
- **Firebase Auth** - Industry-standard authentication
- **JWT Tokens** - Secure session management
- **Route Protection** - Private route guards
- **Role-based Access** - Feature-level permissions

### 🔒 Data Protection
- **Environment Variables** - Secure credential management
- **HTTPS Enforcement** - Encrypted data transmission
- **Input Validation** - XSS and injection prevention
- **CORS Configuration** - Secure cross-origin requests

## 📊 Monitoring & Analytics

### 🎯 User Analytics
- **Learning Progress** - Quiz scores and completion rates
- **Feature Usage** - Tool adoption and engagement metrics
- **Session Tracking** - Time spent and interaction patterns
- **Performance Metrics** - Core Web Vitals and load times

### 🔍 Quality & Testing
- **Vitest + JSDOM** - Comprehensive frontend unit and component testing
- **Pytest** - Robust backend endpoint and logic validation
- **GitHub Actions** - Automated CI/CD pipeline for every commit
- **Atomic Operations** - Safe MongoDB updates with `$inc`
- **Centralized API** - Consistent error handling and network resilience

## 🤝 Contributing

**Contribution guidelines:** See `docs/CONTRIBUTING.md` for detailed guidelines, testing rules and PR process.

### Development Workflow
1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Setup** development environment (see Quick Start)
4. **Make** changes following code style guidelines
5. **Test** both frontend and backend thoroughly
6. **Commit** with descriptive messages
7. **Push** to feature branch
8. **Open** Pull Request with detailed description

### Code Style Guidelines
- **Frontend**: ESLint + Prettier, React best practices
- **Backend**: PEP 8, type hints where applicable
- **Git**: Conventional commits, feature branch workflow
- **Testing**: Unit tests for critical functionality

### Project Guidelines
- **Architecture**: Keep components small and focused
- **Fetching**: Use the `edvantaAPI` client for all network requests
- **Testing**: Follow the "10/10 quality" standard with JSDOM tests
- **UI**: Ensure mobile-first responsive design
- **Accessibility**: Write accessible code (WCAG compliance)

## 📝 Available Scripts

### Frontend (`client/`)
```bash
npm run dev          # Start Vite development server (localhost:5173)
npm run build        # Build production bundle in dist/
npm run preview      # Preview production build locally
npm run test         # Run Vitest test suite once
npm run test:watch   # Run Vitest in interactive watch mode
npm run lint         # Run ESLint validation
```

### Backend (`server/`)
```bash
python app.py                    # Start Flask development server (localhost:5000)
pytest                           # Run full Pytest test suite (63 tests)
pytest --cov=app                 # Run Pytest with test coverage reporting
pip install -r requirements.txt  # Install production dependencies
pip install -r requirements-dev.txt # Install development/testing tools
```

## 🚨 Troubleshooting

### Common Issues

**Backend Issues:**
- **MongoDB connection failed** - Check `MONGODB_URI`, verify network access in Atlas
- **Gemini API errors** - Confirm valid `GEMINI_API_KEY`, check quota (15 req/min free tier)

**Frontend Issues:**
- **Firebase configuration invalid** - Verify all 6 `VITE_FIREBASE_*` variables
- **API connection failed** - Ensure backend is running, check `VITE_API_BASE_URL`
- **YouTube API errors** - Verify `VITE_YOUTUBE_API_KEY`, check quota (100 req/day)
- **Vite build failed** - Check TypeScript errors, verify TailwindCSS config

**Detailed Troubleshooting:** See `server/.env.example` and `client/.env.example` for comprehensive troubleshooting guides.

### Health Checks
```bash
# Backend health
curl http://localhost:5000/
curl http://localhost:5000/api/runtime-features

# Frontend development server
npm run dev -- --debug
```

## 🛣️ Roadmap & Future Improvements

Planned items and improvements we plan to add (short-term and long-term):

- Improve conversational context with long-term memory and user profiling
- Add more fine-grained role-based access and admin dashboards
- Multi-language support and localization (i18n)
- CI/CD pipelines for automated tests and deployments (GitHub Actions)
- End-to-end tests and UX benchmarking
- Mobile app wrappers (Expo/React Native) and desktop builds

Contributions and suggestions welcome — please open an issue or a PR.

## Contributors

| [![](https://github.com/parthnarkar.png?size=100)](https://github.com/parthnarkar) | [![](https://github.com/tanish-jain-225.png?size=100)](https://github.com/tanish-jain-225) | [![](https://github.com/pankaj0695.png?size=100)](https://github.com/pankaj0695) | [![](https://github.com/Chief-Ayush.png?size=100)](https://github.com/Chief-Ayush) |
| :--------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------: |
|                 [**Parth Narkar**](https://github.com/parthnarkar)                 |                  [**Tanish Sanghvi**](https://github.com/tanish-jain-225)                  |                [**Pankaj Gupta**](https://github.com/pankaj0695)                 |                [**Ayush Attarde**](https://github.com/Chief-Ayush)                 |


## 🆘 Support

- **Documentation**: Check individual README files in `client/` and `server/`
- **Issues**: Open GitHub issue with error details and environment info
- **Health Checks**: Use `/api/runtime-features` to diagnose configuration
- **Community**: Join our Discord for real-time support

---

**🚀 Built for the Future of Education**

Edvanta combines cutting-edge AI technology with modern React development practices to create a scalable, accessible and powerful learning platform that delivers exceptional user experiences across all devices.