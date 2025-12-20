export default class StudentController {
  constructor(authService, storageService) {
    this.auth = authService;
    this.storageService = storageService;
    this.user = this.auth.requireAuth("student");
    if (this.user) {
      this.init();
      window.studentApp = this;
    }
  }
  init() {
    const usernameDisplays = document.querySelectorAll(".username");
    const gradeDisplays = document.querySelectorAll(".grade");
    const profilePicDisplay = document.getElementById("profile-picture");
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (window.location.pathname.includes("student-dashboard.html")) {
      if (profilePicDisplay) {
        if (currentUser) {
          profilePicDisplay.src = currentUser.profilePic;
        }
      }
      gradeDisplays.forEach((el) => {
        if (currentUser) {
          el.textContent = `Grade: ${currentUser.grade}`;
        }
      });
      usernameDisplays.forEach((el) => {
        if (currentUser) {
          el.textContent = currentUser.username;
        }
      });
    }
    this.renderDashboard();
    this.attachEvents();
  }

  attachEvents() {
    const mainEl = document.querySelector("main");
    if (!mainEl) return;
    mainEl.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-start")) {
        localStorage.setItem("activeExamId", e.target.dataset.id);
        // student-dashboard.html is in /views, instructions file is named quiz-instructions.html
        window.location.href = "quiz-instructions.html";
      }
      if (e.target.classList.contains("btn-review")) {
        localStorage.setItem("activeResultId", e.target.dataset.id);
        window.location.href = "student-result.html";
      }
      if (e.target.classList.contains("back")) {
        localStorage.removeItem("activeResultId");
        window.location.href = "student-dashboard.html";
      }
    });
  }

  renderDashboard() {
    // 1. Get Assignments for this student
    const myAssignments = this.storageService
      .getAssignments()
      .filter((a) => a.studentId === this.user.id);
    const myResults = this.storageService
      .getResults()
      .filter((r) => r.studentId === this.user.id);
    const completedExamIds = myResults.map((r) => r.examId);

    // 2. Filter Pending Exams (From assignments that are NOT in results)
    const pendingAssignments = myAssignments.filter(
      (a) => !completedExamIds.includes(a.examId)
    );

    // 3. Resolve Exam Objects
    const allExams = this.storageService.getExams();

    // Stats
    const totalScore = myResults.reduce((sum, r) => sum + r.score, 0);
    const maxScore = myResults.reduce((sum, r) => sum + r.totalScore, 0);
    const avg = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    const statCompletedEl = document.getElementById("statCompleted");
    if (statCompletedEl) statCompletedEl.innerText = myResults.length;
    const statAvgEl = document.getElementById("statAvg");
    if (statAvgEl) statAvgEl.innerText = avg + "%";

    // Render Pending
    const pendingEl = document.getElementById("pendingList");

    if (pendingEl) {
      pendingEl.innerHTML = "";
      if (pendingAssignments.length) {
        pendingEl.innerHTML = pendingAssignments
          .map((a) => {
            const exam = allExams.find((e) => e.id === a.examId);
            if (!exam) return "";
            return `
              <li class="quiz-item card flex flex-col gap-6">
                <img
                  src="../assets/img-placeholder.jpg"
                  alt="Quiz Image"
                  class="quiz-img"
                />
                <span class="quiz-title">${exam.title}</span>
                <span class="quiz-duration">⏱️ ${exam.durationMinutes} Minutes</span>
                <span class="quiz-question-count">📖 ${exam.questionsCount} Questions</span>
                <button class="btn btn-primary btn-sm btn-start" data-id="${exam.id}">
                  Start Quiz
                </button>
              </li>`;
          })
          .join("");
      } else {
        pendingEl.innerHTML =
          '<p class="text-muted text-center col-span-2">No pending exams.</p>';
      }
    }

    // Render History
    const historyEl = document.getElementById("completedList");
    if (historyEl) {
      if (myResults.length) {
        historyEl.innerHTML = myResults
          .map((r) => {
            const exam = allExams.find((e) => e.id === r.examId) || {
              title: "Unknown",
            };
            return `
              <li class="quiz-item card flex flex-col gap-6">
                <img
                  src="../assets/img-placeholder.jpg"
                  alt="Quiz Image"
                  class="quiz-img"
                />
                <span class="quiz-title">${exam.title}</span>
                <span class="quiz-score">${r.score}/${r.totalScore}</span>
                <span class="quiz-date">Completed ${new Date(
                  r.date
                ).toLocaleDateString()}</span>
                <button class="btn btn-primary btn-sm btn-review" data-id="${
                  r.id
                }">
                  Review Quiz
                </button>
              </li>`;
          })
          .join("");
      } else {
        historyEl.innerHTML =
          '<p class="text-muted text-center">No history yet.</p>';
      }
    }
  }
}
