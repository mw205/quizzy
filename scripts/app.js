import StudentController from "./controllers/student-controller.js";
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
  }
});
