const API_BASE_URL =
  window.QUIZZY_API_BASE_URL ||
  (window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://quizzy-backend-nr7f.onrender.com");

export class ApiService {
  static async request(path, { method = "GET", body, headers = {} } = {}) {
    const token = localStorage.getItem("backendAccessToken");
    const requestHeaders = { ...headers };

    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }

    if (body && !(body instanceof FormData)) {
      requestHeaders["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message = Array.isArray(data?.message)
        ? data.message.join(", ")
        : data?.message ||
          data ||
          `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    return data;
  }

  static login(credentials) {
    return this.request("/auth/login", { method: "POST", body: credentials });
  }

  static register(user) {
    return this.request("/auth/register", { method: "POST", body: user });
  }

  static getCourses() {
    return this.request("/courses");
  }

  static createCourse(course) {
    return this.request("/courses", { method: "POST", body: course });
  }

  static getCourseById(id) {
    return this.request(`/courses/${id}`);
  }

  static getQuestionsByChapter(chapterId) {
    return this.request(`/questions/chapter/${chapterId}`);
  }

  static createQuestion(question) {
    return this.request("/questions", { method: "POST", body: question });
  }

  static generateOptimumExam(requirements) {
    return this.request("/exams", { method: "POST", body: requirements });
  }

  static getExams() {
    return this.request("/exams");
  }

  static getExamById(id) {
    return this.request(`/exams/${id}`);
  }

  static enrollInCourse(courseId) {
    return this.request("/enrollments", { method: "POST", body: { courseId } });
  }

  static getMyEnrollments() {
    return this.request("/enrollments/my-courses");
  }

  static async uploadImage(file) {
    const formData = new FormData();
    formData.append("file", file);
    return this.request("/upload/image", { method: "POST", body: formData });
  }
}
