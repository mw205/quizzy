export default class TeacherController {
  constructor(authService, storageService) {
    this.authService = authService;
    this.storageService = storageService;
    this.currentUser = this.authService.requireAuth("teacher");
    this.assignExamId = null;
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
    this.renderExamsList();
  }
  attachEventHandlers() {
    document.querySelectorAll(".nav-btn").forEach((e) => {
      e.addEventListener("click", () => this.switchTab(e.dataset.tab));
    });
    document.querySelector("#examsTab").addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-assign")) {
        this.showAssignModal(e.target.dataset.id);
      }
    });
    document.getElementById("studentSearch").addEventListener("keyup", (e) => {
      this.renderAssignModal(e.target.value);
    });
    document
      .getElementById("modalCancel")
      .addEventListener("click", (e) => this.closeAssignModal());
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
  renderExamsList() {
    const exams = this.storageService.getExams();
    const currentTeacherExams = exams.filter(
      (exam) => exam.creatorId === this.currentUser.id
    );

    document.querySelector("#exams-list").innerHTML = currentTeacherExams
      .map((exam) => {
        const assignments = this.storageService
          .getAssignments()
          .filter((assignment) => assignment.examId === exam.id);
        return `
              <div class="card flex justify-between items-center mb-2">
                            <div>
                                <strong>${exam.title}</strong>
                                <br>
                                <span class="text-sm text-muted">${
                                  exam.questions.length
                                } Qs .${assignments.length} Assigned</span>

                            </div>
                            <button class="btn btn-outline btn-assign" data-id="${
                              exam.id
                            }">
                                Assign
                            </button>
                        </div>
        `;
      })
      .join("");
  }
  showAssignModal(id) {
    const modalEl = document.querySelector(".modal");
    modalEl.classList.add("active");
    this.assignExamId = id;
    this.renderAssignModal();
  }
  closeAssignModal() {
    const modalEl = document.querySelector(".modal");
    modalEl.classList.remove("active");
  }
  renderAssignModal(query = "") {
    document.getElementById("closeModalIcon").addEventListener(
      "click",
      (e) => {
        this.closeAssignModal();
      }
    );
    const assignments = this.storageService.getAssignments();
    const assignedStudentsIDs = assignments
      .filter((a) => a.examId === this.assignExamId)
      .map((a) => a.studentId);
    const students = this.storageService
      .getStudents()
      .filter((s) => s.username.toLowerCase().includes(query));
    document.getElementById("studentList").innerHTML = students
      .map((s) => {
        return `
            <label class="flex items-center justify-between p-2 hover:bg-gray-100 border-b cursor-pointer">
                <div class="flex items-center gap-2">
                    <img src="${s.profilePic}" class="w-8 h-8 rounded-full">
                    <span>${s.username}</span>
                </div>
                <input type="checkbox" value="${s.id}" ${
          assignedStudentsIDs.includes(s.id) ? "checked disabled" : ""
        } class="assign-check">
            </label>
        `;
      })
      .join("");
    }
}
