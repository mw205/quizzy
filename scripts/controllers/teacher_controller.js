import Assignments from "../models/assignments.js";
import Exam from "../models/exam.js";
import { ImagesService } from "../services/images_service.js";
export default class TeacherController {
  constructor(authService, storageService) {
    this.authService = authService;
    this.storageService = storageService;
    this.currentUser = this.authService.requireAuth("teacher");
    this.assignExamId = null;
    this.editExamId = null;
    this.newQuestions = [];
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
      if (e.target.classList.contains("btn-edit")) {
        this.showEditExam(e.target.dataset.id);
      }
    });
    document.getElementById("studentSearch").addEventListener("keyup", (e) => {
      this.renderAssignModal(e.target.value);
    });
    document
      .getElementById("modalCancel")
      .addEventListener("click", (e) => this.closeAssignModal());
    document
      .getElementById("closeModalIcon")
      .addEventListener("click", (e) => this.closeAssignModal());
    document.getElementById("modalSave").addEventListener("click", (e) => {
      this.saveAssignments();
    });

    document
      .getElementById("addQuestionBtn")
      .addEventListener("click", (e) => this.addQuestion());
    document
      .getElementById("questionsContainer")
      .addEventListener("change", (e) => this.handleQuestionChange(e));
    document
      .querySelector("#questionsContainer")
      .addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-remove-q")) {
          this.removeQuestion(e.target.dataset.index);
        }
      });
    document.getElementById("autoFillBtn").addEventListener("click", (e) => {
      this.autoFill();
    });
    document
      .getElementById("create-exam-form")
      .addEventListener("submit", (e) => this.handleCreateExam(e));
    document
      .querySelector(".scrollable-area")
      .addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-view-result")) {
          this.openResultView(e.target.dataset.id);
        }
      });
    document
      .querySelectorAll(".constraint-input")
      .forEach((input) => input.addEventListener("input", () => this.updateConstraintSummary()));
    document
      .getElementById("generateExamBtn")
      ?.addEventListener("click", () => this.handleGenerateOptimumExam());
    this.updateConstraintSummary();
  }


  switchTab(tabId) {
    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.add("hidden"));
    if (["results-tab", "exams-tab", "create-tab"].includes(tabId)) {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(`[data-tab="${tabId}"]`)
        .forEach((b) => b.classList.add("active"));
    } else {
      if (tabId === "result-details-tab") {
        document
          .querySelectorAll(".tab-btn")
          .forEach((b) => b.classList.remove("active"));

        document
          .querySelectorAll(`[data-tab="results-tab"]`)
          .forEach((b) => b.classList.add("active"));
      }
    }

    document.getElementById(tabId).classList.remove("hidden");
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
    const students = this.storageService.getStudents();
    document.getElementById("resultsBody").innerHTML = relevantResults
      .map((result) => {
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
                <td><button class="btn btn-sm btn-outline btn-view-result" data-id="${
                  result.id
                }">View</button>
        </tr>`;
      })
      .join("");
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
                                <span class="text-sm text-muted">${exam.questions.length} Qs .${assignments.length} Assigned</span>
                            </div>
                            <div>
                                <button class="btn btn-outline btn-assign" data-id="${exam.id}">
                                    Assign
                                </button>
                                <button class="btn btn-outline btn-edit ml-2" data-id="${exam.id}">
                                    Edit
                                </button>
                            </div>
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
  showEditExam(id) {
    const exam = this.storageService.getExams().find((e) => e.id === id);
    if (!exam) return alert("Exam not found");
    this.editExamId = id;

    // populate form values
    document.getElementById("examName").value = exam.title;
    document.querySelector('[name="exam-duration"]').value =
      exam.durationMinutes;

    // convert stored questions to editor format
    this.newQuestions = exam.questions.map((q) => {
      const correctIdx = q.options
        ? q.options.findIndex((o) => o === q.correctAnswer)
        : 0;
      return {
        id: q.id || `q_${Date.now()}`,
        text: q.text || "",
        image: q.image || null,
        options: q.options ? q.options.slice() : ["", "", "", ""],
        correctAnswerIdx: correctIdx >= 0 ? correctIdx : 0,
        score: q.score || 1,
        difficulty: q.difficulty || "Easy",
      };
    });

    // update button text and open editor
    const saveBtn = document.getElementById("saveExamBtn");
    if (saveBtn) saveBtn.innerText = "💾 Save Changes";
    this.renderExamEditor();
    this.switchTab("createExamTab");
  }

  renderAssignModal(query = "") {
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
  saveAssignments() {
    const checks = document.querySelectorAll(
      ".assign-check:checked:not(:disabled)"
    );
    const studentIds = Array.from(checks).map((check) => check.value);
    const assignements = this.storageService.getAssignments();
    studentIds.map((sid) => {
      const newAssignement = new Assignments({
        id: `assignment_${assignements.length + 1}`,
        creatorId: this.currentUser.id,
        examId: this.assignExamId,
        status: "pending",
        studentId: sid,
        date: new Date().toISOString(),
      });
      this.storageService.addAssignment(newAssignement);
    });
    alert("new assignement added!");
    this.closeAssignModal();
    this.renderExamsList();
  }
  renderExamEditor() {
    const container = document.getElementById("questionsContainer");
    const totalScore = this.newQuestions.reduce(
      (sum, current) => sum + parseInt(current.score),
      0
    );
    document.getElementById(
      "questionsCount"
    ).innerText = `${this.newQuestions.length}/15`;
    document.getElementById(
      "questionsTotalScore"
    ).innerText = `${totalScore}/100 Pts`;
    container.innerHTML = this.newQuestions
      .map(
        (q, i) => `
            <div class="card question-card border p-4 rounded mb-4">
                <div class="flex justify-between mb-2">
                    <strong>Question ${i + 1}</strong>
                    <button type="button" class="text-danger text-sm btn-remove-q btn-icon" data-index="${i}">❌</button>
                </div>
                <div class="mb-4 mt-4">
                    ${
                      q.image
                        ? `<img src="${q.image}" class="h-20 mb-2 object-cover items-center">`
                        : ""
                    }
                    <span class="loader"></span>
                    <label for="imageUpload${
                      q.id
                    }" class ="mb-4 btn btn-outline btn-sm cursor-pointer text-center w-full">Upload Image (optional)</label>
                    <input type="file" accept="image/*" class="text-sm" id="imageUpload${
                      q.id
                    }" data-index="${i}" hidden>
                </div>
                <div class="input-group mb-2">
                    <input type="text" placeholder="Question Text" value="${
                      q.text
                    }" data-index="${i}" data-field="text">
                </div>
                    <select data-index="${i}" data-field="chapter" class="w-full p-2 border rounded">
                        <option value="ch_1" ${q.chapter === "ch_1" ? "selected" : ""}>Chapter 1</option>
                        <option value="ch_2" ${q.chapter === "ch_2" ? "selected" : ""}>Chapter 2</option>
                        <option value="ch_3" ${q.chapter === "ch_3" ? "selected" : ""}>Chapter 3</option>
                    </select>
                </div>
                <div class="grid-3 mb-2 gap-2">
                    ${q.options
                      .map(
                        (opt, oi) => `
                        <input type="text" placeholder="Choice ${
                          oi + 1
                        }" value="${opt}" data-index="${i}" data-field="option-${oi}">
                    `
                      )
                      .join("")}
                </div>
                <div class="flex gap-2 mt-4">
                    <select data-index="${i}" data-field="correctAnswer" class="w-full p-2 border rounded">
                        ${q.options
                          .map(
                            (_, oi) =>
                              `<option value="${oi}" ${
                                q.correctAnswerIdx === oi ? "selected" : ""
                              }>Correct: Choice ${oi + 1}</option>`
                          )
                          .join("")}
                    </select>
                    <select data-index="${i}" data-field="difficulty" class="w-full p-2 border rounded">
                        <option value="SIMPLE" ${
                          q.difficulty === "SIMPLE" || q.difficulty === "Easy" ? "selected" : ""
                        }>Simple</option>
                        <option value="DIFFICULT" ${
                          q.difficulty === "DIFFICULT" || q.difficulty === "Hard" ? "selected" : ""
                        }>Difficult</option>
                    </select>
                    <select data-index="${i}" data-field="objective" class="w-full p-2 border rounded">
                        <option value="REMEMBERING" ${
                          q.objective === "REMEMBERING" ? "selected" : ""
                        }>Remembering</option>
                        <option value="UNDERSTANDING" ${
                          q.objective === "UNDERSTANDING" ? "selected" : ""
                        }>Understanding</option>
                        <option value="CREATIVITY" ${
                          q.objective === "CREATIVITY" ? "selected" : ""
                        }>Creativity</option>
                    </select>
                    <input type="number" placeholder="Pts" value="${
                      q.score || 5
                    }" data-index="${i}" data-field="score" class="w-full p-2 border rounded">
                </div>
            </div>
        `
      )
      .join("");
  }
  addQuestion() {
    this.newQuestions.push({
      id: `q_${Date.now()}`,
      text: "",
      chapter: "ch_1",
      options: ["", "", ""],
      correctAnswerIdx: 0,
      score: 5,
      difficulty: "SIMPLE",
      objective: "REMEMBERING",
    });
    this.renderExamEditor();
  }
  removeQuestion(index) {
    this.newQuestions.splice(index, 1);
    this.renderExamEditor();
  }
  autoFill() {
    console.log("autofill matrix");

    const diffs = ["SIMPLE", "DIFFICULT"];
    const objs = ["REMEMBERING", "UNDERSTANDING", "CREATIVITY"];
    const chs = ["ch_1", "ch_2", "ch_3"];

    this.newQuestions = Array(12)
      .fill(null)
      .map((_, i) => {
        const diff = diffs[i % 2];
        const obj = objs[Math.floor(i / 2) % 3];
        const ch = chs[Math.floor(i / 4) % 3];
        return {
          id: `q_${Date.now()}_${i}`,
          text: `Sample Question ${i + 1} (${diff} - ${obj})`,
          chapter: ch,
          options: [`Choice 1 (Correct)`, `Choice 2`, `Choice 3`],
          correctAnswerIdx: 0,
          score: 5,
          difficulty: diff,
          objective: obj,
        };
      });
    document.getElementById("examName").value = "Software Engineering Midterm";
    this.renderExamEditor();
  }

  handleCreateExam(e) {
    e.preventDefault();
    //check if the number of questions is 15 or more.
    const finalQuestions = this.newQuestions.map((q) => {
      return { ...q, correctAnswer: q.options[q.correctAnswerIdx] };
    });

    if (finalQuestions.length < 15) {
      alert("Exam must have at least 15 Questions");
      return;
    }
    //validate score
    const totalScore = finalQuestions.reduce(
      (sum, q) => sum + parseInt(q.score),
      0
    );
    if (totalScore !== 100) {
      alert(
        `Total score must be exactly 100. current total is : ${totalScore}`
      );
      return;
    }
    // validate that quiz has mix of difficulties
    const hasEasy = finalQuestions.some((q) => q.difficulty === "Easy");
    const hasMedium = finalQuestions.some((q) => q.difficulty === "Medium");
    const hasHard = finalQuestions.some((q) => q.difficulty === "Hard");
    if (!hasEasy || !hasMedium || !hasHard) {
      alert(
        "Exam must contain at least one question of each difficulty level (Easy, Medium, Hard)."
      );
      return;
    }

    // If editing an existing exam update it instead
    if (this.editExamId) {
      const updatedExam = new Exam({
        id: this.editExamId,
        creatorId: this.currentUser.id,
        title: document.getElementById("examName").value,
        durationMinutes: document.querySelector('[name="exam-duration"]').value,
        questions: finalQuestions,
      });
      this.storageService.updateExam(updatedExam);
      alert("Exam updated!");
      this.editExamId = null;
      const saveBtn = document.getElementById("saveExamBtn");
      if (saveBtn) saveBtn.innerText = "💾 Save Exam";
      this.switchTab("examsTab");
      this.renderExamsList();
      return;
    }

    // create new exam
    const newExam = new Exam({
      id: `exam_${Date.now()}`,
      creatorId: this.currentUser.id,
      title: document.getElementById("examName").value,
      durationMinutes: document.querySelector('[name="exam-duration"]').value,
      questions: finalQuestions,
    });
    this.storageService.addExam(newExam);
    alert("Exam created!!");

    window.location.reload();
  }

  handleQuestionChange(e) {
    const index = parseInt(e.target.dataset.index);
    const currentLoader = document.querySelectorAll(".loader").item(index);
    if (e.target.type === "file") {
      currentLoader.classList.add("active");
      const file = e.target.files[0];
      if (file) {
        ImagesService.uploadImage(file).then((imageUrl) => {
          this.newQuestions[index].image = imageUrl;
          currentLoader.classList.remove("active");
          this.renderExamEditor();
        });
      }
      return;
    }

    const field = e.target.dataset.field;
    const value = e.target.value;

    if (field.startsWith("option")) {
      const optIndex = parseInt(field.split("-")[1]);
      this.newQuestions[index].options[optIndex] = value;
    } else if (field === "correctAnswer") {
      const selectedIdx = parseInt(value);
      this.newQuestions[index].correctAnswerIdx = selectedIdx;
    } else {
      this.newQuestions[index][field] = value;
    }
  }
  openResultView(resultId) {
    const result = this.storageService
      .getResults()
      .find((result) => result.id === resultId);
    const student = this.storageService
      .getStudents()
      .find((student) => student.id === result.studentId);
    const exam = this.storageService
      .getExams()
      .find((exam) => exam.id === result.examId);
    const questionsToRender =
      result.questions && result.questions.length > 0
        ? result.questions
        : exam
        ? exam.questions
        : [];
    document.getElementById("detailExamTitle").innerText = exam.title;
    document.getElementById(
      "detailStudentInfo"
    ).innerText = `${student.username}•${result.score}/${result.totalScore}Points`;
    document.getElementById("resultDetailsContent").innerHTML =
      questionsToRender
        .map((question, idx) => {
          const userAns = result.answers[question.id];
          const isCorrect = userAns === question.correctAnswer;
          return `
              <div class="card p-4 ${
                isCorrect
                  ? "border-l-4 border-green-500"
                  : "border-l-4 border-red-500"
              }">
                  <div class="flex justify-between items-start mb-2">
                      <div class="font-bold text-lg">Q${idx + 1}: ${
            question.text
          }</div>
                      <span class="badge ${
                        isCorrect
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }">
                          ${
                            isCorrect
                              ? "Correct (+" + question.score + ")"
                              : "Incorrect (0/" + question.score + ")"
                          }
                      </span>
                  </div>
                  ${
                    question.image
                      ? `<img src="${question.image}" class="h-32 mb-4 rounded object-cover">`
                      : ""
                  }
                  <div class="flex flex-col gap-2 mt-3 text-sm">
                      ${question.options
                        .map((opt) => {
                          const isSelected = userAns === opt;
                          const isCorrectOpt = opt === question.correctAnswer;
                          let bgClass = "bg-gray-50 border border-gray-200";
                          let textClass = "text-gray-700";
                          if (isCorrectOpt) {
                            bgClass = "bg-green-100 border border-green-300";
                            textClass = "text-green-800 font-semibold";
                          } else if (isSelected) {
                            bgClass = "bg-red-100 border border-red-300";
                            textClass = "text-red-800 font-semibold";
                          }
                          return `
                              <div class="p-3 rounded ${bgClass} ${textClass} flex justify-between items-center">
                                  <span>${opt}</span>
                                  <span>
                                      ${
                                        isSelected
                                          ? '<span class="text-xs uppercase mr-2 font-bold">(Student)</span>'
                                          : ""
                                      }
                                      ${
                                        isCorrectOpt
                                          ? "✅"
                                          : isSelected
                                          ? "❌"
                                          : ""
                                      }
                                  </span>
                              </div>
                          `;
                        })
                        .join("")}
                  </div>
              </div>
          `;
        })
        .join("");
    this.switchTab("result-details-tab");
  }
  closeResultView() {
    this.switchTab("resultsTab");
  }

  updateConstraintSummary() {
    const ch1 = parseInt(document.getElementById("ch1Req")?.value || "0");
    const ch2 = parseInt(document.getElementById("ch2Req")?.value || "0");
    const ch3 = parseInt(document.getElementById("ch3Req")?.value || "0");
    const simple = parseInt(document.getElementById("simpleReq")?.value || "0");
    const difficult = parseInt(document.getElementById("difficultReq")?.value || "0");
    const rem = parseInt(document.getElementById("remReq")?.value || "0");
    const und = parseInt(document.getElementById("undReq")?.value || "0");
    const cre = parseInt(document.getElementById("creReq")?.value || "0");

    const chTotal = ch1 + ch2 + ch3;
    const diffTotal = simple + difficult;
    const objTotal = rem + und + cre;

    const summaryEl = document.getElementById("totalsSummary");
    const feedbackEl = document.getElementById("constraintFeedback");

    if (summaryEl) {
      summaryEl.innerText = `Chapters: ${chTotal} | Difficulty: ${diffTotal} | Objectives: ${objTotal}`;
    }

    if (feedbackEl) {
      if (chTotal === diffTotal && diffTotal === objTotal) {
        feedbackEl.innerText = `✅ All target totals match (${chTotal} Questions)`;
        feedbackEl.className = "text-sm font-bold text-success";
      } else {
        feedbackEl.innerText = `❌ Mismatch! Chapter total (${chTotal}), Difficulty total (${diffTotal}), and Objective total (${objTotal}) must be equal.`;
        feedbackEl.className = "text-sm font-bold text-danger";
      }
    }
  }

  handleGenerateOptimumExam() {
    const ch1 = parseInt(document.getElementById("ch1Req")?.value || "0");
    const ch2 = parseInt(document.getElementById("ch2Req")?.value || "0");
    const ch3 = parseInt(document.getElementById("ch3Req")?.value || "0");
    const simple = parseInt(document.getElementById("simpleReq")?.value || "0");
    const difficult = parseInt(document.getElementById("difficultReq")?.value || "0");
    const rem = parseInt(document.getElementById("remReq")?.value || "0");
    const und = parseInt(document.getElementById("undReq")?.value || "0");
    const cre = parseInt(document.getElementById("creReq")?.value || "0");

    const chTotal = ch1 + ch2 + ch3;
    const diffTotal = simple + difficult;
    const objTotal = rem + und + cre;

    if (chTotal !== diffTotal || diffTotal !== objTotal) {
      alert("Cannot generate exam: Target totals must be equal across Chapters, Difficulties, and Educational Objectives.");
      return;
    }

    // Ensure we have questions available
    if (!this.newQuestions || this.newQuestions.length === 0) {
      this.autoFill(); // seed matrix questions if bank is empty
    }

    const availableBank = this.newQuestions;
    const targetN = chTotal;

    // Filter matching questions
    const ch1Qs = availableBank.filter((q) => q.chapter === "ch_1");
    const ch2Qs = availableBank.filter((q) => q.chapter === "ch_2");
    const ch3Qs = availableBank.filter((q) => q.chapter === "ch_3");

    const selected = [
      ...ch1Qs.slice(0, ch1),
      ...ch2Qs.slice(0, ch2),
      ...ch3Qs.slice(0, ch3),
    ].slice(0, targetN);

    // Calculate actual breakdown
    const actCh1 = selected.filter((q) => q.chapter === "ch_1").length;
    const actCh2 = selected.filter((q) => q.chapter === "ch_2").length;
    const actCh3 = selected.filter((q) => q.chapter === "ch_3").length;

    const actSimple = selected.filter((q) => q.difficulty === "SIMPLE").length;
    const actDiff = selected.filter((q) => q.difficulty === "DIFFICULT").length;

    const actRem = selected.filter((q) => q.objective === "REMEMBERING").length;
    const actUnd = selected.filter((q) => q.objective === "UNDERSTANDING").length;
    const actCre = selected.filter((q) => q.objective === "CREATIVITY").length;

    const dev =
      Math.abs(ch1 - actCh1) +
      Math.abs(ch2 - actCh2) +
      Math.abs(ch3 - actCh3) +
      Math.abs(simple - actSimple) +
      Math.abs(difficult - actDiff) +
      Math.abs(rem - actRem) +
      Math.abs(und - actUnd) +
      Math.abs(cre - actCre);

    const isExact = dev === 0;

    // Render output
    const outputEl = document.getElementById("generatedExamOutput");
    const badgeEl = document.getElementById("matchScoreBadge");
    const summaryBody = document.getElementById("distributionSummaryBody");
    const qList = document.getElementById("generatedQuestionsList");

    if (badgeEl) {
      badgeEl.innerText = isExact
        ? `Exact Match (Score: 0.0 Deviation)`
        : `Closest Match (Score: ${dev.toFixed(1)} Deviation)`;
      badgeEl.className = isExact
        ? "badge bg-green-100 text-green-800 text-sm p-2"
        : "badge bg-yellow-100 text-yellow-800 text-sm p-2";
    }

    const categories = [
      { name: "Chapter 1 Questions", req: ch1, act: actCh1 },
      { name: "Chapter 2 Questions", req: ch2, act: actCh2 },
      { name: "Chapter 3 Questions", req: ch3, act: actCh3 },
      { name: "Simple Difficulty", req: simple, act: actSimple },
      { name: "Difficult Difficulty", req: difficult, act: actDiff },
      { name: "Remembering Objective", req: rem, act: actRem },
      { name: "Understanding Objective", req: und, act: actUnd },
      { name: "Creativity Objective", req: cre, act: actCre },
    ];

    if (summaryBody) {
      summaryBody.innerHTML = categories
        .map(
          (c) => `
          <tr>
            <td class="font-semibold">${c.name}</td>
            <td>${c.req}</td>
            <td>${c.act}</td>
            <td>${c.req === c.act ? '<span class="text-success">✅ Met</span>' : '<span class="text-danger">⚠️ Difference</span>'}</td>
          </tr>
        `
        )
        .join("");
    }

    if (qList) {
      qList.innerHTML = selected
        .map(
          (q, i) => `
          <div class="border p-3 rounded bg-white shadow-sm">
            <div class="flex justify-between items-start mb-2">
              <strong>Question ${i + 1}: ${q.text}</strong>
              <div class="flex gap-1">
                <span class="badge bg-blue-100 text-blue-800">${q.chapter?.toUpperCase()}</span>
                <span class="badge bg-purple-100 text-purple-800">${q.difficulty}</span>
                <span class="badge bg-green-100 text-green-800">${q.objective}</span>
              </div>
            </div>
            <ul class="list-disc pl-5 text-sm text-gray-700">
              ${(q.options || [])
                .map(
                  (opt, oi) => `
                <li class="${oi === q.correctAnswerIdx ? "font-bold text-green-700" : ""}">${opt} ${oi === q.correctAnswerIdx ? "✅ (Correct Choice)" : ""}</li>
              `
                )
                .join("")}
            </ul>
          </div>
        `
        )
        .join("");
    }

    if (outputEl) {
      outputEl.classList.remove("hidden");
      outputEl.scrollIntoView({ behavior: "smooth" });
    }
  }
}

