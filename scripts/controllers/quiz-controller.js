import { ApiService } from "../services/api_service.js";

export default class ExamController {
  constructor(authService, mode) {
    this.auth = authService;
    this.user = this.auth.requireAuth("student");
    this.mode = mode;
    if (this.user) this.init();
    window.examApp = this;
  }

  async init() {
    if (this.mode === "player") await this.initPlayer();
    if (this.mode === "results") await this.initResults();
  }

  async initPlayer() {
    const examId = localStorage.getItem("activeExamId");
    if (!examId) {
      window.location.href = "student-dashboard.html";
      return;
    }

    try {
      this.rawExam = await ApiService.getExamById(examId);
    } catch (err) {
      console.error("Failed to load exam:", err);
      alert("Failed to load exam from server.");
      window.location.href = "student-dashboard.html";
      return;
    }

    const userExamKey = `${this.user.id}_${examId}`;
    const completedExams = JSON.parse(localStorage.getItem("completedExams") || "{}");
    if (completedExams[userExamKey]) {
      localStorage.setItem("activeResultId", userExamKey);
      window.location.href = "student-result.html";
      return;
    }

    const rawQuestions = (this.rawExam.examQuestions || []).map((eq) => eq.Question);
    if (!rawQuestions.length) {
      alert("This exam has no questions.");
      window.location.href = "student-dashboard.html";
      return;
    }

    this.questions = rawQuestions.map((q) => {
      const correctChoice = q.choices?.find((c) => c.isCorrect);
      return {
        id: q.id,
        text: q.text,
        image: q.imageUrl,
        difficulty: q.difficulty,
        objective: q.objective,
        choices: q.choices || [],
        correctAnswerText: correctChoice ? correctChoice.text : "",
      };
    });

    this.currentQ = 0;
    this.answers = {};
    this.timeLeft = 15 * 60; // 15 minutes default timer
    this.locked = false;

    this._popHandler = () => {
      history.go(1);
    };
    history.pushState(null, "", location.href);
    window.addEventListener("popstate", this._popHandler);

    this.renderQuestion();
    this.startTimer();

    const nextBtn = document.getElementById("nextBtn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => this.nextQuestion());
    }

    const choicesContainer = document.getElementById("choicesContainer");
    if (choicesContainer) {
      choicesContainer.addEventListener("click", (e) => {
        if (this.locked) return;
        const target = e.target;
        if (target.classList.contains("answer-row")) {
          const input = target.querySelector(".choice-btn");
          if (input) {
            input.checked = true;
            this.selectAnswer(input.dataset.value, target);
          }
          return;
        }
        if (target.classList.contains("choice-btn")) {
          const row = target.closest(".answer-row");
          this.selectAnswer(target.dataset.value, row);
        }
      });
    }
  }

  renderQuestion() {
    const q = this.questions[this.currentQ];
    if (!q) return;

    try {
      const qIndexEl = document.getElementById("qIndex");
      if (qIndexEl) {
        qIndexEl.innerText = `Question ${this.currentQ + 1} / ${this.questions.length}`;
      }

      const imgContainer = document.getElementById("questionImageContainer");
      const img = document.getElementById("questionImage");
      if (imgContainer && img) {
        if (q.image) {
          imgContainer.style.display = "block";
          img.src = q.image;
        } else {
          imgContainer.style.display = "none";
        }
      }

      const container = document.getElementById("choicesContainer");
      if (container) {
        container.innerHTML = q.choices
          .map(
            (choice, idx) => `
              <div class="answer-row border rounded-3 p-3 mb-2 d-flex align-items-center" data-value="${this.escapeHtml(choice.text)}">
                <input type="radio" class="choice-btn me-3" name="answer" id="opt_${this.currentQ}_${idx}" data-value="${this.escapeHtml(choice.text)}">
                <label class="mb-0 flex-grow-1 fw-medium" for="opt_${this.currentQ}_${idx}">${this.escapeHtml(choice.text)}</label>
              </div>
            `
          )
          .join("");
      }

      document.querySelectorAll(".answer-row").forEach((r) => {
        r.classList.remove("correct", "incorrect");
      });
      document.querySelectorAll(".choice-btn").forEach((i) => {
        i.checked = false;
        i.disabled = false;
      });

      this.locked = false;

      const qTextEl = document.getElementById("qText");
      if (qTextEl) qTextEl.innerText = q.text;

      const nextBtn = document.getElementById("nextBtn");
      if (nextBtn) nextBtn.disabled = true;
    } catch (err) {
      console.error("renderQuestion failed:", err);
    }
  }

  selectAnswer(selectedText, rowEl) {
    const q = this.questions[this.currentQ];
    this.answers[q.id] = selectedText;
    this.locked = true;

    document.querySelectorAll(".choice-btn").forEach((i) => (i.disabled = true));

    const rows = document.querySelectorAll(".answer-row");
    rows.forEach((r) => {
      const val = r.dataset.value;
      r.classList.remove("correct", "incorrect");
      if (val === q.correctAnswerText) {
        r.classList.add("correct");
      }
      if (val === selectedText && val !== q.correctAnswerText) {
        r.classList.add("incorrect");
      }
    });

    if (rowEl) {
      const input = rowEl.querySelector(".choice-btn");
      if (input) input.checked = true;
    }

    const nextBtn = document.getElementById("nextBtn");
    if (nextBtn) nextBtn.disabled = false;
  }

  nextQuestion() {
    if (this.currentQ < this.questions.length - 1) {
      this.currentQ++;
      history.pushState(null, "", location.href);
      this.renderQuestion();
    } else {
      this.finishExam();
    }
  }

  finishExam() {
    clearInterval(this.interval);
    if (this._popHandler) {
      window.removeEventListener("popstate", this._popHandler);
    }

    let correctCount = 0;
    this.questions.forEach((q) => {
      if (this.answers[q.id] === q.correctAnswerText) {
        correctCount++;
      }
    });

    const totalQuestions = this.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const userExamKey = `${this.user.id}_${this.rawExam.id}`;

    const resultRecord = {
      userExamKey,
      examId: this.rawExam.id,
      examTitle: `${this.rawExam.course?.name || "Course"} Exam`,
      studentId: this.user.id,
      score: correctCount,
      totalQuestions,
      percentage,
      date: new Date().toISOString(),
      answers: this.answers,
      questions: this.questions,
    };

    const completedExams = JSON.parse(localStorage.getItem("completedExams") || "{}");
    completedExams[userExamKey] = resultRecord;
    localStorage.setItem("completedExams", JSON.stringify(completedExams));
    localStorage.setItem("activeResultId", userExamKey);

    window.location.href = "student-result.html";
  }

  startTimer() {
    this.interval = setInterval(() => {
      this.timeLeft--;
      const m = Math.floor(this.timeLeft / 60);
      const s = this.timeLeft % 60;
      const timerDisplay = document.getElementById("timerDisplay");
      if (timerDisplay) {
        timerDisplay.innerText = `${m}:${s < 10 ? "0" + s : s}`;
      }
      if (this.timeLeft <= 0) this.finishExam();
    }, 1000);
  }

  async initResults() {
    const resultKey = localStorage.getItem("activeResultId");
    const completedExams = JSON.parse(localStorage.getItem("completedExams") || "{}");
    const result = resultKey ? completedExams[resultKey] : null;

    if (!result) {
      window.location.href = "student-dashboard.html";
      return;
    }

    const resExamName = document.getElementById("resExamName");
    const resTotalQuestions = document.getElementById("resTotalQuestions");
    const correctCountEl = document.querySelector(".correct-count");
    const wrongCountEl = document.querySelector(".wrong-count");
    const resScore = document.getElementById("resScore");

    if (resExamName) resExamName.innerText = result.examTitle;
    if (resTotalQuestions) resTotalQuestions.innerText = result.totalQuestions;
    if (correctCountEl) correctCountEl.innerText = result.score;
    if (wrongCountEl) wrongCountEl.innerText = result.totalQuestions - result.score;
    if (resScore) resScore.innerText = `${result.percentage}%`;

    const reviewContainer = document.getElementById("reviewContainer");
    if (reviewContainer && result.questions) {
      reviewContainer.innerHTML = result.questions
        .map((q, idx) => {
          const userAns = result.answers[q.id];
          const isCorrect = userAns === q.correctAnswerText;
          return `
            <div class="card border-0 shadow-sm rounded-4 mb-3 border-start border-4 ${
              isCorrect ? "border-success" : "border-danger"
            }">
              <div class="card-body p-4">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h6 class="fw-bold mb-0">Q${idx + 1}: ${this.escapeHtml(q.text)}</h6>
                  <span class="ms-2">${
                    isCorrect 
                      ? '<i class="fa-solid fa-circle-check text-success fs-5"></i>' 
                      : '<i class="fa-solid fa-circle-xmark text-danger fs-5"></i>'
                  }</span>
                </div>
                ${
                  q.image
                    ? `<img src="${this.escapeHtml(q.image)}" class="img-fluid rounded mb-3 result-question-image" style="max-height: 200px;" />`
                    : ""
                }
                <div class="text-sm mt-2">
                  <div>Your Answer: <strong class="${isCorrect ? 'text-success' : 'text-danger'}">${this.escapeHtml(userAns || "Skipped")}</strong></div>
                  ${
                    !isCorrect
                      ? `<div class="mt-1 text-success">Correct Answer: <strong>${this.escapeHtml(q.correctAnswerText)}</strong></div>`
                      : ""
                  }
                </div>
              </div>
            </div>
          `;
        })
        .join("");
    }

    const backBtn = document.getElementById("backBtn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        localStorage.removeItem("activeResultId");
        window.location.href = "student-dashboard.html";
      });
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
