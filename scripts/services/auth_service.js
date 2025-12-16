import Student from "../models/student.js";
export default class AuthService {
  constructor(storageService) {
    this.storageService = storageService;
  }

  async loginAsStudent(username, password) {
    const user = this.storageService
      .getUsers()
      .find(
        (user) =>
          user.username === username &&
          user.role === "student" &&
          user.password === password
      );
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
      return true;
    } else {
      alert("Invalid username or password");
    }
    return false;
  }
  async loginAsTeacher(username, password) {
    const user = this.storageService
      .getUsers()
      .find(
        (user) =>
          user.username === username &&
          user.role === "teacher" &&
          user.password === password
      );
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
      return true;
    } else {
      alert("Invalid username or password");
    }
    return false;
  }
  async registerStudent(data) {
    const users = this.storageService.getUsers();
    if (users.some((u) => u.username === data.username)) {
      alert("username is already taken.");
      throw new Error("Username is already taken.");
    }
    const student = new Student({
      ...data,
      id: "student_" + this.storageService.getUsers().length + 1,
      role: "student",
      profilePic: data.profilePic,
    });
    this.storageService.addUser(student);
    return true;
  }
  getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser"));
  }
  //to ensure that the user is authorized and authenticated
  requireAuth(role) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      if (role === "teacher") {
        window.location.href = "../views/teacher-login.html";
      } else {
        window.location.href = "../../views/student-dashboard.html";
      }
      return null;
    }
    // handle incorrect role
    if (role !== currentUser.role) {
      window.location.href = "../views/index.html";
      return null;
    }
    return currentUser;
  }
}
