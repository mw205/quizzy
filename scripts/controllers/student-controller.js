export class StudentController {
  constructor(authService, storageService) {
    this.auth = authService;
    this.storageService = storageService;
    this.user = this.auth.requireAuth("student");
    if (!this.user) {
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
    document.querySelector("main").addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-start")) {
        localStorage.setItem("activeExamId", e.target.dataset.id);
        window.location.href = "instructions.html";
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
    const myAssignments = this.storage
      .getAssignments()
      .filter((a) => a.studentId === this.user.id);
    const myResults = this.storage
      .getResults()
      .filter((r) => r.studentId === this.user.id);
    const completedExamIds = myResults.map((r) => r.examId);

    // 2. Filter Pending Exams (From assignments that are NOT in results)
    const pendingAssignments = myAssignments.filter(
      (a) => !completedExamIds.includes(a.examId)
    );

    // 3. Resolve Exam Objects
    const allExams = this.storage.getExams();

    // Stats
    const totalScore = myResults.reduce((sum, r) => sum + r.score, 0);
    const maxScore = myResults.reduce((sum, r) => sum + r.totalScore, 0);
    const avg = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    document.getElementById("statCompleted").innerText = myResults.length;
    document.getElementById("statAvg").innerText = avg + "%";

    // Render Pending
    const pendingEl = document.getElementById("pendingList");
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
}
