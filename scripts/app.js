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
    //Todo: complete the logic of login form
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
        await authService.registerStudent({
          name,
          username,
          password,
          grade: parseInt(grade),
          mobile,
          profilePic: profilePicBase64,
        });
        alert("Registration successful!");
        form.reset();
        window.location.href = "../views/studentDashboard.html";
      } catch (error) {
        console.error("Error saving user:", error);
        alert("An error occurred during registration: " + error.message);
      }
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  if (path.includes("register.html")) {
    handleAuthForms(authService);
  }
});
