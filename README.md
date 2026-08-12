# Quizzy Frontend 🧠✨

**Quizzy** is a clean, dynamic web application built with Vanilla JavaScript (ES6 Modules) and custom CSS. It connects to a NestJS backend REST API with PostgreSQL, Prisma ORM, and Cloudinary for authentication, course & chapter management, question bank management, dynamic exam generation (constraint optimization), and student exam attempts.

## 🚀 Key Features

### 👨‍🏫 For Teachers
- **Course & Chapter Management**: Create courses and specify chapter counts dynamically.
- **Question Bank Manager**: Add questions to specific chapters with exactly 3 choices, 1 correct choice, difficulty level (Simple / Difficult), educational objective (Remembering / Understanding / Creativity), and optional image uploads via Cloudinary.
- **Exam Designer**: Specify chapter question quotas, difficulty distribution, and educational objective targets. Run the optimum exam algorithm to receive exact or closest matching exam recommendations.
- **Generated Exams List**: View all persisted exam configurations and deviation scores.

### 👩‍🎓 For Students
- **Student Dashboard**: View available exams dynamically loaded from the NestJS backend.
- **Interactive Quiz Player**: Take timed exams with image support and choice validation.
- **Results Review**: Instant score breakdown and detailed question-by-question review highlighting correct and incorrect answers.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS (CSS Variables, Flexbox, Grid)
- **Application Logic**: Vanilla JavaScript (ES6 Modules)
- **API Services**: `ApiService` (Fetch API with JWT Authentication Bearer tokens)
- **Backend API**: NestJS (Node.js / TypeScript / PostgreSQL / Prisma)

---

## 📂 Project Structure

```text
frontend/
├── index.html                  # Landing Page (Student Login)
├── README.md                   # Documentation
├── assets/                     # Logos, placeholders, and icons
├── styles/                     # CSS stylesheets
│   ├── main.css                # Global styles, variables, & utilities
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
    ├── app.js                  # Application entry point & routing
    ├── services/
    │   ├── api_service.js      # REST API client
    │   └── auth_service.js     # JWT Auth manager
    └── controllers/
        ├── teacher_controller.js  # Teacher dashboard controller
        ├── student-controller.js  # Student dashboard controller
        └── quiz-controller.js     # Exam player & result controller
```

---

## 🚀 Getting Started

1. Ensure the NestJS backend is running at `http://localhost:3000` (or configured via `window.QUIZZY_API_BASE_URL`).
2. Serve the `frontend/` directory using any local HTTP server (e.g. `npx serve` or VS Code Live Server).
3. Open `index.html` in your browser.
