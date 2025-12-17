import Results from "../models/results.js";

export default class ExamController {
  constructor(authService, storageService, mode) {
    this.auth = authService;
    this.storage = storageService;
    this.user = this.auth.requireAuth("student");
    this.mode = mode;
    if (this.user) this.init();
    window.examApp = this;
  }
  init() {
    if (this.mode === "player") this.initPlayer();
    if (this.mode === "results") this.initResults();
  }
  initPlayer() {
    const examId = localStorage.getItem("activeExamId");
    this.exam = this.storage.getExams().find((e) => e.id === examId);
    if (!this.exam) return (window.location.href = "student-dashboard.html");

    // If a result already exists for this student & exam, redirect to results (no retakes)
    const existingResult = this.storage
      .getResults()
      .find((r) => r.examId === this.exam.id && r.studentId === this.user.id);
    if (existingResult) {
      localStorage.setItem("activeResultId", existingResult.id);
      return (window.location.href = "student-result.html");
    }

    this.currentQ = 0;
    this.answers = {};
    this.timeLeft = this.exam.durationMinutes * 60;

    this.renderQuestion();
    this.startTimer();

    document
      .getElementById("nextBtn")
      .addEventListener("click", () => this.nextQuestion());
    document
      .getElementById("choicesContainer")
      .addEventListener("click", (e) => {
        const target = e.target;
        // If user clicked the row, find the input inside
        if (target.classList.contains("answer-row")) {
          const input = target.querySelector(".choice-btn");
          if (input) {
            input.checked = true;
            this.selectAnswer(input.dataset.value, target);
          }
          return;
        }
        if (target.classList.contains("choice-btn")) {
          // clicked the radio input
          const row = target.closest(".answer-row");
          this.selectAnswer(target.dataset.value, row);
        }
      });
  }

  renderQuestion() {
    const q = this.exam.questions[this.currentQ];
    try {
      document.getElementById("qIndex").innerText = `Question ${
        this.currentQ + 1
      } / ${this.exam.questions.length}`;
      console.log("ExamController.renderQuestion:", this.currentQ, q);

      const imgContainer = document.getElementById("questionImageContainer");
      const img = document.getElementById("questionImage");
      if (q.image) {
        imgContainer.style.display = "block";
        // try to load the remote image; if it fails use a local placeholder
        img.crossOrigin = "anonymous";
        img.onload = () => {
          console.log("Question image loaded:", q.image);
          imgContainer.style.display = "block";
          img.classList.remove("fallback-image");
        };
        img.onerror = () => {
          console.warn("Question image failed to load:", q.image);
          img.onerror = null; // avoid loops
          img.src = "../assets/img-placeholder.jpg"; // local fallback
          imgContainer.style.display = "block";
          img.classList.add("fallback-image");
        };
        img.src = q.image;
      }

      const container = document.getElementById("choicesContainer");
      container.innerHTML = q.options
        .map(
          (opt, idx) => `
            <div class="answer-row" data-value="${opt}">
              <input type="radio" class="choice-btn" name="answer" id="opt_${this.currentQ}_${idx}" data-value="${opt}">
              <label for="opt_${this.currentQ}_${idx}">${opt}</label>
            </div>
          `
        )
        .join("");

      // Update question text after replacing innerHTML so the qText element exists
      const qTextEl = document.getElementById("qText");
      if (qTextEl) qTextEl.innerText = q.text;

      document.getElementById("nextBtn").disabled = true;
    } catch (err) {
      console.error("renderQuestion failed", err);
    }
  }

  selectAnswer(value, btn) {
    const qId = this.exam.questions[this.currentQ].id;
    this.answers[qId] = value;

    // clear previous selection styles
    document.querySelectorAll(".answer-row").forEach((r) => {
      r.style.background = "transparent";
      r.style.borderColor = "var(--border-color)";
    });

    if (btn) {
      btn.style.background = "rgba(37,99,235,0.05)";
      btn.style.borderColor = "var(--primary)";
      // ensure the radio inside is checked
      const input = btn.querySelector(".choice-btn");
      if (input) input.checked = true;
    }

    document.getElementById("nextBtn").disabled = false;
  }

  nextQuestion() {
    if (this.currentQ < this.exam.questions.length - 1) {
      this.currentQ++;
      this.renderQuestion();
    } else {
      this.finishExam();
    }
  }

  finishExam() {
    clearInterval(this.interval);
    let score = 0;
    this.exam.questions.forEach((q) => {
      if (this.answers[q.id] === q.correctAnswer) score += q.score;
    });

    const result = new Results({
      id: `result_${Date.now()}`,
      examId: this.exam.id,
      studentId: this.user.id,
      score: score,
      totalScore: this.exam.totalScore,
      answers: this.answers,
    });

    this.storage.addResult(result);
    localStorage.setItem("activeResultId", result.id);
    window.location.href = "student-result.html";
  }

  startTimer() {
    this.interval = setInterval(() => {
      this.timeLeft--;
      const m = Math.floor(this.timeLeft / 60);
      const s = this.timeLeft % 60;
      document.getElementById("timerDisplay").innerText = `${m}:${
        s < 10 ? "0" + s : s
      }`;
      if (this.timeLeft <= 0) this.finishExam();
    }, 1000);
  }

  initResults() {
    const resultId = localStorage.getItem("activeResultId");
    const result = this.storage.getResults().find((r) => r.id === resultId);
    if (!result) return (window.location.href = "student-dashboard.html");

    const exam = this.storage.getExams().find((e) => e.id === result.examId);

    document.getElementById("resExamName").innerText = exam.title;
    document.getElementById("resTotalQuestions").innerText =
      exam.questions.length;
    const correctCount = exam.questions.filter(
      (q) => result.answers[q.id] === q.correctAnswer
    ).length;
    document.querySelector(".correct-count").innerText = correctCount;
    document.querySelector(".wrong-count").innerText =
      exam.questions.length - correctCount;
    document.getElementById("resScore").innerText = `${Math.round(
      (result.score / result.totalScore) * 100
    )}%`;

    document.getElementById("reviewContainer").innerHTML = exam.questions
      .map((q, idx) => {
        const userAns = result.answers[q.id];
        const isCorrect = userAns === q.correctAnswer;
        return `
                <div class="card mt-6" style="border-left: 5px solid ${
                  isCorrect ? "var(--success)" : "var(--danger)"
                }">
                    <div class="flex justify-between items-start">
                        <div>
                            <strong>Q${idx + 1}: ${q.text}</strong>
                            ${
                              q.image
                                ? `<br><img src="${q.image}" class="h-20 mt-2 result-question-image" onerror="this.src='../assets/img-placeholder.jpg'" />`
                                : ""
                            }
                        </div>
                        <span>${isCorrect ? "✅" : "❌"}</span>
                    </div>
                    <div class="text-sm mt-2">
                        Your Answer: <b>${userAns || "Skipped"}</b><br>
                        ${
                          !isCorrect
                            ? `Correct Answer: <b>${q.correctAnswer}</b>`
                            : ""
                        }
                    </div>
                </div>
            `;
      })
      .join("");
    document.getElementById("backBtn").addEventListener("click", () => {
      localStorage.removeItem("activeResultId");
      window.location.href = "student-dashboard.html";
    });
  }
}
