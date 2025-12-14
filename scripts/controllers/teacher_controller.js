export default class TeacherController {
  constructor(authService, storageService) {
    this.authService = authService;
    this.storageService = storageService;
    this.currentUser = this.authService.requireAuth("teacher");
    this.init();
  }
  init() {
    this.attachEventHandlers();
    this.renderElements();
  }
  renderElements() {
    const firstNavBtn = document.querySelector(".nav-btn");
    if (firstNavBtn) {
      this.switchTab(firstNavBtn.dataset.tab);
    }
    this.renderResultsTable();
  }
  attachEventHandlers() {
    document.querySelectorAll(".nav-btn").forEach((e) => {
      e.addEventListener("click", () => this.switchTab(e.dataset.tab));
    });
  }

  switchTab(tabId) {
    if (!tabId) return;
    document
      .querySelectorAll(".nav-btn")
      .forEach((element) => element.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((element) => {
      element.classList.add("hidden");
    });
    // acitvate current tab and the current button
    document.getElementById(tabId).classList.remove("hidden");
    document.querySelectorAll(`[data-tab=${tabId}]`).forEach((element) => {
      element.classList.add("active");
    });
  }
  renderResultsTable() {
    console.log("anything");

    const exams = this.storageService.getExams();
    const currentTeacherExams = exams.filter(
      (exam) => exam.creatorId === this.currentUser.id
    );
    const results = this.storageService.getResults();
    const relevantResults = results.filter((result) =>
      currentTeacherExams.some((exam) => result.examId === exam.id)
    );
    const students = this.storageService
      .getUsers()
      .filter((user) => user.role === "student");
    document.getElementById("resultsBody").innerHTML = relevantResults.map(
      (result) => {
        const student = students.find(
          (student) => student.id === result.studentId
        );
        const exam = currentTeacherExams.find(
          (exam) => exam.id === result.examId
        );
        return `<tr>
        <td>${student.username}</td>
        <td>${exam.title}</td>
        <td class ="text-bold ${
          result.score / result.totalScore > 0.5
            ? "text-success"
            : "text-danger"
        }">${result.score}/${result.totalScore}</td>
        <td>${new Date(result.date).toLocaleDateString()}</td>
        </tr>`;
      }
    );
  }
}
