import { ApiService } from "./api_service.js";

export default class AuthService {
  async loginAsStudent(email, password) {
    try {
      const response = await ApiService.login({ email, password });
      if (response.data.role !== "STUDENT") {
        throw new Error("This account is not a student account.");
      }

      localStorage.setItem("backendAccessToken", response.accessToken);
      localStorage.setItem(
        "currentUser",
        JSON.stringify({ ...response.data, role: "student" })
      );
      return true;
    } catch (error) {
      alert(error.message || "Invalid email or password");
      return false;
    }
  }

  async loginAsTeacher(email, password) {
    try {
      const response = await ApiService.login({ email, password });

      if (response.data.role !== "TEACHER") {
        throw new Error("This account is not a teacher account.");
      }

      localStorage.setItem("backendAccessToken", response.accessToken);
      localStorage.setItem(
        "currentUser",
        JSON.stringify({ ...response.data, role: "teacher" })
      );
      return true;
    } catch (error) {
      alert(error.message || "Invalid email or password");
      return false;
    }
  }

  async registerTeacher({ name, email, password }) {
    const response = await ApiService.register({
      name,
      email,
      password,
      role: "TEACHER",
    });
    localStorage.setItem("backendAccessToken", response.accessToken);
    localStorage.setItem(
      "currentUser",
      JSON.stringify({ ...response.data, role: "teacher" })
    );
    return response.data;
  }

  async registerStudent({ name, email, password }) {
    const response = await ApiService.register({
      name,
      email,
      password,
      role: "STUDENT",
    });
    localStorage.setItem("backendAccessToken", response.accessToken);
    localStorage.setItem(
      "currentUser",
      JSON.stringify({ ...response.data, role: "student" })
    );
    return response.data;
  }

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("currentUser"));
    } catch {
      return null;
    }
  }

  // Ensure that the user is authorized and authenticated
  requireAuth(role) {
    const currentUser = this.getCurrentUser();
    const isRoot = window.location.pathname.endsWith("/index.html") || window.location.pathname === "/";
    const prefix = isRoot ? "views/" : "";

    if (!currentUser) {
      if (role === "teacher") {
        window.location.href = `${prefix}teacher-login.html`;
      } else {
        window.location.href = isRoot ? "index.html" : "../index.html";
      }
      return null;
    }

    if (role.toUpperCase() !== currentUser.role?.toUpperCase()) {
      if (currentUser.role?.toUpperCase() === "TEACHER") {
        window.location.href = `${prefix}teacher-dashboard.html`;
      } else {
        window.location.href = `${prefix}student-dashboard.html`;
      }
      return null;
    }
    return currentUser;
  }
}
