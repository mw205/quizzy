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

  // Remove duplicate results keeping the latest by date
  _dedupeResults(results) {
    const map = new Map();
    results.forEach((r) => {
      const key = `${r.studentId}_${r.examId}`;
      if (!map.has(key)) map.set(key, r);
      else {
        const existing = map.get(key);
        const existingDate = existing.date
          ? new Date(existing.date).getTime()
          : 0;
        const curDate = r.date ? new Date(r.date).getTime() : 0;
        if (curDate > existingDate) map.set(key, r);
      }
    });
    return Array.from(map.values());
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

        // Clean up duplicate results if any exist in persisted data
        try {
          const storedResults =
            JSON.parse(localStorage.getItem("results")) || [];
          const deduped = this._dedupeResults(storedResults);
          if (deduped.length !== storedResults.length) {
            localStorage.setItem("results", JSON.stringify(deduped));
          }
        } catch (err) {
          console.error("Failed to dedupe results:", err);
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
  getStudents() {
    return this.getUsers().filter((student) => student.role === "student");
  }
  getExams() {
    return this._get("exams").map((e) => new Exam(e));
  }

  getResults() {
    const raw = this._get("results");
    const unique = this._dedupeResults(raw);
    return unique.map((r) => new Result(r));
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

  updateExam(exam) {
    const exams = this._get("exams");
    const idx = exams.findIndex((e) => e.id === exam.id);
    if (idx >= 0) {
      exams[idx] = exam;
    } else {
      exams.push(exam);
    }
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
    // If there's an existing result for the same student & exam, replace it
    const existingIndex = results.findIndex(
      (r) => r.examId === result.examId && r.studentId === result.studentId
    );
    if (existingIndex >= 0) {
      results.splice(existingIndex, 1);
    }
    results.push(result);
    this._save("results", results);

    // Auto-update assignment status
    this.updateAssignmentStatus(result.examId, result.studentId, "completed");
  }
}
