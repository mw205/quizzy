import { ApiService } from "../services/api_service.js";

export default class StudentController {
  constructor(authService) {
    this.auth = authService;
    this.user = this.auth.requireAuth("student");
    if (this.user) {
      this.init();
      window.studentApp = this;
    }
  }

  async init() {
    const usernameDisplays = document.querySelectorAll(".username");
    const gradeDisplays = document.querySelectorAll(".grade");
    const currentUser = this.auth.getCurrentUser();

    if (window.location.pathname.includes("student-dashboard.html") && currentUser) {
      usernameDisplays.forEach((el) => {
        el.textContent = currentUser.name || currentUser.email || "Student";
      });
      gradeDisplays.forEach((el) => {
        el.textContent = currentUser.email ? `Email: ${currentUser.email}` : "";
      });
    }

    await this.renderDashboard();
    this.attachEvents();
  }

  attachEvents() {
    const mainEl = document.querySelector("main");
    if (!mainEl) return;
    mainEl.addEventListener("click", (e) => {
      const startBtn = e.target.closest(".btn-start");
      if (startBtn) {
        const examId = startBtn.dataset.id;
        localStorage.setItem("activeExamId", examId);
        window.location.href = `quiz-instructions.html?examId=${examId}`;
      }

      const reviewBtn = e.target.closest(".btn-review");
      if (reviewBtn) {
        const resultKey = reviewBtn.dataset.id;
        localStorage.setItem("activeResultId", resultKey);
        window.location.href = "student-result.html";
      }

      if (e.target.classList.contains("back")) {
        localStorage.removeItem("activeResultId");
        window.location.href = "student-dashboard.html";
      }
    });
  }

  async renderDashboard() {
    const pendingEl = document.getElementById("pendingList");
    const historyEl = document.getElementById("completedList");
    const statCompletedEl = document.getElementById("statCompleted");
    const statAvgEl = document.getElementById("statAvg");

    if (pendingEl) {
      pendingEl.innerHTML = `
        <div class="text-center py-4 w-100 text-muted">
          <div class="spinner-border text-primary mb-2" role="status"></div>
          <div>Loading available assignments...</div>
        </div>
      `;
    }

    if (historyEl) {
      historyEl.innerHTML = `
        <div class="text-center py-4 w-100 text-muted">
          <div class="spinner-border text-primary mb-2" role="status"></div>
          <div>Loading quiz history...</div>
        </div>
      `;
    }

    try {
      const allExams = await ApiService.getExams();
      const completedMap = JSON.parse(localStorage.getItem("completedExams") || "{}");
      const userCompletedKeys = Object.keys(completedMap).filter((key) => key.startsWith(`${this.user.id}_`));

      const completedResults = userCompletedKeys.map((key) => completedMap[key]);
      const completedExamIds = completedResults.map((r) => r.examId);

      const pendingExams = allExams.filter((exam) => !completedExamIds.includes(exam.id));

      if (statCompletedEl) statCompletedEl.innerText = completedResults.length;
      if (statAvgEl) {
        if (completedResults.length > 0) {
          const sumPct = completedResults.reduce((acc, r) => acc + (r.percentage || 0), 0);
          statAvgEl.innerText = `${Math.round(sumPct / completedResults.length)}%`;
        } else {
          statAvgEl.innerText = "0%";
        }
      }

      if (pendingEl) {
        if (pendingExams.length) {
          pendingEl.innerHTML = pendingExams
            .map((exam) => `
              <li class="quiz-item card border-0 shadow-sm rounded-4">
                <img
                  src="../assets/img-placeholder.jpg"
                  alt="Quiz Image"
                  class="quiz-img"
                />
                <span class="quiz-title mb-1">${this.escapeHtml(exam.course?.name || "Exam")}</span>
                <span class="quiz-duration text-muted text-sm"><i class="fa-regular fa-clock me-1"></i>15 Minutes</span>
                <span class="quiz-question-count text-muted text-sm"><i class="fa-solid fa-list-check me-1"></i>${exam.totalQuestions || 0} Questions</span>
                <span class="text-sm fw-semibold ${exam.isExactMatch ? 'text-success' : 'text-warning'}">
                  <i class="fa-solid ${exam.isExactMatch ? 'fa-circle-check' : 'fa-triangle-exclamation'} me-1"></i>
                  ${exam.isExactMatch ? "Exact Match" : "Closest Match"}
                </span>
                <button class="btn btn-primary btn-sm btn-start mt-2" data-id="${exam.id}">
                  <i class="fa-solid fa-play me-1"></i>Start Quiz
                </button>
              </li>
            `)
            .join("");
        } else {
          pendingEl.innerHTML = '<p class="text-muted text-center py-4 w-100">No pending exams available.</p>';
        }
      }

      if (historyEl) {
        if (completedResults.length) {
          historyEl.innerHTML = completedResults
            .map((r) => `
              <li class="quiz-item card border-0 shadow-sm rounded-4">
                <img
                  src="../assets/img-placeholder.jpg"
                  alt="Quiz Image"
                  class="quiz-img"
                />
                <span class="quiz-title mb-1">${this.escapeHtml(r.examTitle || "Completed Exam")}</span>
                <span class="quiz-score fs-3 fw-bold text-primary">${r.percentage}%</span>
                <span class="text-muted text-sm mb-2"><i class="fa-solid fa-check-double me-1 text-success"></i>Score: ${r.score}/${r.totalQuestions}</span>
                <span class="quiz-date text-muted text-xs mb-2"><i class="fa-regular fa-calendar-check me-1"></i>Completed ${new Date(r.date).toLocaleDateString()}</span>
                <button class="btn btn-outline-primary btn-sm btn-review mt-2" data-id="${this.user.id}_${r.examId}">
                  <i class="fa-solid fa-eye me-1"></i>Review Quiz
                </button>
              </li>
            `)
            .join("");
        } else {
          historyEl.innerHTML = '<p class="text-muted text-center py-4 w-100">No completed quiz history yet.</p>';
        }
      }
    } catch (error) {
      console.error("Failed to render student dashboard:", error);
      if (pendingEl) pendingEl.innerHTML = `<p class="text-danger text-center py-4">${this.escapeHtml(error.message || "Failed to load dashboard data.")}</p>`;
    }
  }

  escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}
