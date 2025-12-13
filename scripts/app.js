import { handleRegistration } from "services/auth_service.js";
document.addEventListener("DOMContentLoaded", () => {
  // Check which page we are on
  const registerForm = document.querySelector("form");
  const path = window.location.pathname;

  if (path.includes("register.html") && registerForm) {
    handleRegistration(registerForm);

    // Preview image on selection
    const profileInput = document.getElementById("profilePic");
    const profilePreview = document.getElementById("profilePreview");

    if (profileInput && profilePreview) {
      profileInput.addEventListener("change", function (e) {
        if (this.files && this.files[0]) {
          const reader = new FileReader();
          reader.onload = function (e) {
            profilePreview.src = e.target.result;
          };
          reader.readAsDataURL(this.files[0]);
        }
      });
    }
  }
});
