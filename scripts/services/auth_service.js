import { compressImage } from "../utils/utils";
export function handleRegistration(form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = form.username.value;
    const password = form.password.value;
    const grade = form.grade.value;
    const mobile = form.mobilenumber.value;
    const profilePicInput = document.getElementById("profilePic");

    // Check if user already exists
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.find((u) => u.username === username)) {
      alert("Username already exists!");
      return;
    }

    let profilePicBase64 = null;

    try {
      if (profilePicInput.files && profilePicInput.files[0]) {
        profilePicBase64 = await compressImage(profilePicInput.files[0]);
      }

      const newUser = {
        id: Date.now(),
        username,
        password,
        grade,
        mobile,
        role: "student",
        profilePic: profilePicBase64, // Stores small Base64 string or null
      };

      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));

      alert("Registration successful! Please login.");
      window.location.href = "../index.html";
    } catch (error) {
      console.error("Error saving user:", error);
      alert("An error occurred during registration.");
    }
  });
}
