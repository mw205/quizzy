import ExamController from "./controllers/quiz-controller.js";
import StudentController from "./controllers/student-controller.js";
import TeacherController from "./controllers/teacher_controller.js";
import { ApiService } from "./services/api_service.js";
import AuthService from "./services/auth_service.js";

const authService = new AuthService();

export const handleAuthForms = (auth) => {
  const loginForm =
    document.getElementById("loginForm") ||
    document.getElementById("teacherLoginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const email = form.email?.value;
      const password = form.password?.value;
      let success = false;

      if (form.id === "loginForm") {
        success = await auth.loginAsStudent(email, password);
      } else {
        success = await auth.loginAsTeacher(email, password);
      }

      if (success) {
        form.reset();
        if (form.id === "loginForm") {
          window.location.href = "views/student-dashboard.html";
        } else {
          window.location.href = "teacher-dashboard.html";
        }
      }
    });
  }

  const registrationForm = document.getElementById("registrationForm");
  if (registrationForm) {
    registrationForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const password = form.password.value;

      try {
        await auth.registerStudent({ name, email, password });
        alert("Account created successfully!");
        form.reset();
        window.location.href = "student-dashboard.html";
      } catch (error) {
        console.error("Error creating student account:", error);
        alert("An error occurred during registration: " + error.message);
      }
    });
  }

  const teacherRegistrationForm = document.getElementById("teacherRegistrationForm");
  if (teacherRegistrationForm) {
    teacherRegistrationForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      try {
        await auth.registerTeacher({
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          password: form.password.value,
        });
        alert("Teacher account created successfully!");
        window.location.href = "teacher-dashboard.html";
      } catch (error) {
        alert(error.message || "Could not create the teacher account.");
      }
    });
  }
};

export const handleLogout = () => {
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("backendAccessToken");
      const isRoot = window.location.pathname.endsWith("/index.html") || window.location.pathname === "/";
      window.location.href = isRoot ? "index.html" : "../index.html";
    });
  }
};

const applyTheme = (theme) => {
  document.body.classList.toggle("dark", theme === "dark");
  document.documentElement.setAttribute("data-bs-theme", theme);
  const modeBtn = document.getElementById("mode");
  if (modeBtn) {
    modeBtn.innerHTML = theme === "dark" 
      ? '<i class="fa-solid fa-sun text-warning"></i>' 
      : '<i class="fa-solid fa-moon"></i>';
  }
};

const selectedMode = localStorage.getItem("selectedMode") || "light";
applyTheme(selectedMode);

document.addEventListener("DOMContentLoaded", async () => {
  handleAuthForms(authService);
  handleLogout();

  const path = window.location.pathname;

  if (path.includes("teacher-dashboard")) {
    new TeacherController(authService);
  } else if (path.includes("student-dashboard")) {
    new StudentController(authService);
  } else if (path.includes("quiz-questions.html")) {
    new ExamController(authService, "player");
  } else if (path.includes("student-result.html")) {
    new ExamController(authService, "results");
  } else if (path.includes("quiz-instructions.html")) {
    if (!authService.requireAuth("student")) return;

    const params = new URLSearchParams(window.location.search);
    const examIdFromUrl = params.get("examId");
    if (examIdFromUrl) localStorage.setItem("activeExamId", examIdFromUrl);

    const activeExamId = localStorage.getItem("activeExamId");
    const startBtn = document.querySelector(".quiz-btn");

    if (activeExamId) {
      try {
        const exam = await ApiService.getExamById(activeExamId);
        const titleEl = document.querySelector(".quiz-title");
        const descEl = document.querySelector(".quiz-description");
        const qCountEl = document.querySelector(".quiz-question-count");
        const durEl = document.querySelector(".quiz-duration");

        if (titleEl) titleEl.innerText = `${exam.course?.name || "Course"} Exam`;
        if (descEl) descEl.innerText = `Exact constraint match score: ${exam.score}`;
        if (qCountEl) qCountEl.innerHTML = `<i class="fa-solid fa-list-check me-2 text-primary"></i>${exam.totalQuestions || exam.examQuestions?.length || 0} Questions`;
        if (durEl) durEl.innerHTML = `<i class="fa-regular fa-clock me-2 text-primary"></i>15 Minutes`;

        const completedExams = JSON.parse(localStorage.getItem("completedExams") || "{}");
        const currentUser = authService.getCurrentUser();
        const userExamKey = `${currentUser?.id}_${activeExamId}`;

        if (completedExams[userExamKey]) {
          const note = document.createElement("div");
          note.className = "alert alert-info mt-3 fw-semibold";
          note.innerHTML = `<i class="fa-solid fa-circle-info me-2"></i>You have already completed this exam on ${new Date(completedExams[userExamKey].date).toLocaleDateString()}. You cannot retake it.`;

          const container = document.querySelector(".quiz-instruction-container .card-body");
          if (container) container.appendChild(note);

          if (startBtn) {
            startBtn.disabled = false;
            startBtn.innerHTML = '<i class="fa-solid fa-eye me-2"></i>Review Result';
            startBtn.addEventListener("click", () => {
              localStorage.setItem("activeResultId", userExamKey);
              window.location.href = "student-result.html";
            });
          }
        } else {
          if (startBtn) {
            startBtn.disabled = false;
            startBtn.addEventListener("click", () => {
              localStorage.setItem("activeExamId", activeExamId);
              window.location.href = "quiz-questions.html";
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch exam instructions:", err);
        alert("Failed to load exam details from backend.");
      }
    } else {
      if (startBtn) {
        startBtn.addEventListener("click", () => {
          alert("No active exam selected. Please start the quiz from your dashboard.");
        });
      }
    }
  }

  const modeBtn = document.getElementById("mode");
  if (modeBtn) {
    modeBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-bs-theme") || "light";
      const nextTheme = current === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      localStorage.setItem("selectedMode", nextTheme);
    });
  }
});
