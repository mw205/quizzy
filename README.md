# Quizzy Frontend 🧠✨

**Quizzy** is a dynamic single-page web application built with Vanilla JavaScript (ES6 Modules), Bootstrap 5.3, and FontAwesome 6. It connects to a NestJS backend REST API with PostgreSQL, Prisma ORM, and Cloudinary for authentication, course & chapter management, question bank management, dynamic exam generation (constraint optimization), student exam attempts, and real-time score reviews.

---

## 🚀 Key Features

### 👨‍🏫 For Teachers
- **Course & Chapter Management**: Create courses and specify chapter counts dynamically.
- **Question Bank Manager**: Add questions to specific chapters with exactly 3 choices, 1 correct choice, difficulty level (`SIMPLE` / `DIFFICULT`), educational objective (`REMEMBERING` / `UNDERSTANDING` / `CREATIVITY`), and optional image uploads via Cloudinary.
- **Exam Designer**: Specify chapter question quotas, difficulty distribution, and educational objective targets. Run the optimum exam algorithm to receive exact or closest matching exam recommendations.
- **Generated Exams & Modal Preview**: View all persisted exam recommendations and preview full question details, choices, and correct answers inside a Bootstrap 5 modal drawer.

### 👩‍🎓 For Students
- **Student Dashboard**: View available exams and progress stats dynamically loaded from the NestJS backend.
- **Interactive Quiz Player**: Take timed exams with image support and immediate choice feedback (`correct` / `incorrect`).
- **Results Review**: Instant score breakdown and detailed question-by-question review highlighting correct and incorrect answers.

### 🎨 Global UX & Responsive Design
- **Bootstrap 5.3 & FontAwesome 6**: Modern responsive grid layouts, card UI components, badges, and vector icons.
- **Light / Dark Mode**: Theme toggle supporting native Bootstrap 5 dark theme (`data-bs-theme="dark"` / `"light"`).
- **Global Loading Overlay**: Floating backdrop loading indicator during all API fetch operations (`ApiService.js`).

---

## 🛠️ Technology Stack

- **UI Framework & Icons**: Bootstrap 5.3 & FontAwesome 6 (via CDN)
- **Application Logic**: Vanilla JavaScript (ES6 Modules)
- **API Client**: `ApiService` (Fetch API with JWT Authentication Bearer tokens & global spinner overlay)
- **Backend API**: NestJS (Node.js / TypeScript / PostgreSQL / Prisma ORM)

---

## 📂 Project Structure

```text
frontend/
├── index.html                  # Landing Page (Student Login)
├── README.md                   # Documentation
├── assets/                     # Logos, placeholders, and icons
├── styles/                     # CSS stylesheets
│   ├── main.css                # Global design system, variables, & utilities
│   ├── teacher-dashboard.css   # Teacher interface styles
│   ├── student-dashboard-style.css # Student dashboard styles
│   ├── student-quiz-style.css  # Quiz player styles
│   └── quiz-result.css         # Quiz results styles
├── views/                      # HTML views
│   ├── register.html           # Student Registration
│   ├── teacher-login.html      # Teacher Login
│   ├── teacher-register.html   # Teacher Registration
│   ├── student-dashboard.html  # Student Dashboard
│   ├── teacher-dashboard.html  # Teacher Dashboard
│   ├── quiz-instructions.html  # Exam Instructions
│   ├── quiz-questions.html     # Active Quiz Player
│   └── student-result.html     # Exam Results Review
└── scripts/                    # Application logic
    ├── app.js                  # Application entry point, theme toggle, & routing
    ├── services/
    │   ├── api_service.js      # REST API client & global fetch spinner overlay
    │   └── auth_service.js     # JWT Auth manager
    └── controllers/
        ├── teacher_controller.js  # Teacher dashboard & exam preview controller
        ├── student-controller.js  # Student dashboard controller
        └── quiz-controller.js     # Exam player & result review controller
```

---

## 🚀 Getting Started

1. Ensure the NestJS backend is running at `http://localhost:3000` (or configured via `window.QUIZZY_API_BASE_URL`).
2. Serve the `frontend/` directory using any local HTTP server (e.g. `npx serve` or VS Code Live Server).
3. Open `index.html` in your browser.
