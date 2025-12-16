import { initialData } from "../data/initial_data.js";
import Assignment from "../models/assignments.js";
import { Exam } from "../models/exam.js";
import Result from "../models/results.js";
import Student from "../models/student.js";
import Teacher from "../models/teacher.js";
export default class StorageService {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem("app_initialized")) {
      localStorage.setItem("users", JSON.stringify(initialData.users));
      localStorage.setItem("exams", JSON.stringify(initialData.exams));
      localStorage.setItem("results", JSON.stringify(initialData.results));
      localStorage.setItem(
        "assignments",
        JSON.stringify(initialData.assignments)
      );
      localStorage.setItem("app_initialized", "true");
    } else {
      try {
        const storedAssignments =
          JSON.parse(localStorage.getItem("assignments")) || [];
        const storedIds = new Set(storedAssignments.map((a) => a.id));
        const toAdd = initialData.assignments.filter(
          (a) => !storedIds.has(a.id)
        );
        if (toAdd.length) {
          const merged = storedAssignments.concat(toAdd);
          localStorage.setItem("assignments", JSON.stringify(merged));
        }
      } catch (err) {
        console.error("Failed to merge assignments:", err);
      }
    }
  }
  _get(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
  }
  _save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  getUsers() {
    return this._get("users").map((u) =>
      u.role === "teacher" ? new Teacher(u) : new Student(u)
    );
  }

  getExams() {
    return this._get("exams").map((e) => new Exam(e));
  }

  getResults() {
    return this._get("results").map((r) => new Result(r));
  }

  getAssignments() {
    return this._get("assignments").map((a) => new Assignment(a));
  }

  //CRUD operations
  addUser(user) {
    const users = this._get("users");
    users.push(user); // user object is already JSON-serializable
    this._save("users", users);
  }

  // Exam
  addExam(exam) {
    const exams = this._get("exams");
    exams.push(exam);
    this._save("exams", exams);
  }

  // Assignment
  addAssignment(assignment) {
    const assignments = this._get("assignments");
    assignments.push(assignment);
    this._save("assignments", assignments);
  }

  updateAssignmentStatus(examId, studentId, status) {
    const assignments = this.getAssignments();
    const target = assignments.find(
      (a) => a.examId === examId && a.studentId === studentId
    );
    if (target) {
      target.status = status;
      this._save("assignments", assignments);
    }
  }

  // Result
  addResult(result) {
    const results = this._get("results");
    results.push(result);
    this._save("results", results);

    // Auto-update assignment status
    this.updateAssignmentStatus(result.examId, result.studentId, "completed");
  }
}
