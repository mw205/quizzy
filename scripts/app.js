import StudentController from "./controllers/student-controller.js";
import ExamController from "./controllers/quiz-controller.js";
import TeacherController from "./controllers/teacher_controller.js";
import AuthService from "./services/auth_service.js";
import StorageService from "./services/storage_service.js";
import { ImageUtils } from "./utils/ImageUtils.js";
const storageService = new StorageService();
const authService = new AuthService(storageService);

export const handleAuthForms = (auth) => {
  const loginForm =
    document.getElementById("loginForm") ||
    document.getElementById("teacherLoginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const username = form.username.value;
      const password = form.password.value;
      let success = false;
      if (form.id === "loginForm") {
        success = await auth.loginAsStudent(username, password);
      } else {
        success = await auth.loginAsTeacher(username, password);
      }
      if (success) {
        alert("Login successful!");
        form.reset();
        if (form.id === "loginForm") {
          // index.html lives at project root
          window.location.href = "views/student-dashboard.html";
        } else {
          // teacher login lives in /views so use relative path within the folder
          window.location.href = "teacher-dashboard.html";
        }
      }
    });
  }
  const registrationForm = document.getElementById("registrationForm");
  if (registrationForm) {
    const profileInput = document.getElementById("profilePic");
    const profilePreview = document.getElementById("profilePreview");

    if (profileInput && profilePreview) {
      profileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            // Compress before previewing
            const base64 = await ImageUtils.compress(file, 200, 0.8);
            if (profilePreview) profilePreview.src = base64;
          } catch (err) {
            console.error("Image processing failed", err);
          }
        }
      });
    }

    registrationForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const name = form.name.value;
      const username = form.username.value;
      const password = form.password.value;
      const grade = form.grade.value;
      const mobile = form.mobilenumber.value;
      const profilePicInput = document.getElementById("profilePic");

      // Check if user already exists
      let profilePicBase64 = null;
      if (profilePicInput && profilePicInput.files[0]) {
        profilePicBase64 = await ImageUtils.compress(
          profilePicInput.files[0],
          200,
          0.8
        );
      }

      try {
        await auth.registerStudent({
          name,
          username,
          password,
          grade: parseInt(grade),
          mobile,
          profilePic: profilePicBase64,
        });
        alert("Registration successful!");
        form.reset();
        // register.html is in /views, so navigate within the same folder
        window.location.href = "student-dashboard.html";
      } catch (error) {
        console.error("Error saving user:", error);
        alert("An error occurred during registration: " + error.message);
      }
    });
  }
};

export const handleLogout = () => {
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      window.location.href = "../index.html";
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  handleAuthForms(authService);
  handleLogout();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const path = window.location.pathname;
  if (path.includes("teacher-dashboard")) {
    new TeacherController(authService, storageService);
  } else if (path.includes("student-dashboard")) {
    new StudentController(authService, storageService);
  } else if (path.includes("quiz-questions.html")) {
    new ExamController(authService, storageService, "player");
  } else if (path.includes("student-result.html")) {
    new ExamController(authService, storageService, "results");
  } else if (path.includes("quiz-instructions.html")) {
    if (!authService.requireAuth("student")) return;

    // If an examId is present in the URL, store it as the active exam so
    // navigation to the questions page always has a reference.
    const params = new URLSearchParams(window.location.search);
    const examIdFromUrl = params.get("examId");
    if (examIdFromUrl) localStorage.setItem("activeExamId", examIdFromUrl);

    // Resolve active exam (from localStorage) and populate the instructions page
    const activeExamId = localStorage.getItem("activeExamId");
    const exam = activeExamId
      ? storageService.getExams().find((e) => e.id === activeExamId)
      : null;

    const startBtn = document.querySelector(".quiz-btn");

    if (exam) {
      // Populate UI
      const titleEl = document.querySelector(".quiz-title");
      const descEl = document.querySelector(".quiz-description");
      const qCountEl = document.querySelector(".quiz-question-count");
      const durEl = document.querySelector(".quiz-duration");
      if (titleEl) titleEl.innerText = exam.title;
      if (descEl) descEl.innerText = exam.description || "";
      if (qCountEl) qCountEl.innerText = `${exam.questions.length} questions`;
      if (durEl) durEl.innerText = `${exam.durationMinutes} minutes`;

      // If student already has a result for this exam, disable retake and show review option
      const existingResult = storageService
        .getResults()
        .find(
          (r) =>
            r.examId === exam.id &&
            r.studentId === (currentUser && currentUser.id)
        );

      if (existingResult) {
        const note = document.createElement("p");
        note.style.color = "#2c3e50";
        note.style.fontWeight = "600";
        note.style.marginTop = "8px";
        note.innerText = `You have already completed this exam (${new Date(
          existingResult.date
        ).toLocaleDateString()}). You cannot retake it.`;
        const container = document.querySelector(".quiz-instructions");
        if (container) container.appendChild(note);

        if (startBtn) {
          startBtn.disabled = true;
          startBtn.innerText = "Completed — Review Result";
          startBtn.addEventListener("click", () => {
            localStorage.setItem("activeResultId", existingResult.id);
            window.location.href = "student-result.html";
          });
        }
      } else {
        if (startBtn) {
          startBtn.disabled = false;
          startBtn.addEventListener("click", () => {
            // Ensure activeExamId is set
            localStorage.setItem("activeExamId", activeExamId);
            window.location.href = "quiz-questions.html";
          });
        }
      }
    } else {
      // No matching exam found — disable start action and show guidance
      if (startBtn) {
        startBtn.addEventListener("click", () => {
          alert(
            "No active exam selected. Please start the quiz from your dashboard."
          );
        });
      }
      // Show a subtle inline message if possible
      const info = document.createElement("p");
      info.style.color = "#c0392b";
      info.style.marginTop = "8px";
      info.innerText =
        "No exam found. Start the quiz from your dashboard to proceed.";
      const container = document.querySelector(".quiz-instructions");
      if (container) container.appendChild(info);
    }
  }
});
