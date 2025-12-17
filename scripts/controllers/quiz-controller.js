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

  // Fisher–Yates shuffle helper used to randomize questions and answers
  _shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Seeded shuffle using a simple PRNG (Mulberry32) so we can vary the shuffle each attempt
  _mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  _shuffleWithSeed(arr, seed) {
    const s =
      typeof seed === "string"
        ? this._hashStringToInt(seed)
        : +seed || Date.now();
    const rand = this._mulberry32(s);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  _hashStringToInt(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
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

    // Create a randomized copy of questions and per-question randomized options
    const seed =
      localStorage.getItem("activeExamShuffle") || Date.now().toString();
    this.shuffledQuestions = this.exam.questions.map((q) => ({
      ...q,
      options: this._shuffleWithSeed([...q.options], seed + "|" + q.id),
    }));
    this._shuffleWithSeed(this.shuffledQuestions, seed + "|questions");

    this.currentQ = 0;
    this.answers = {};
    this.timeLeft = this.exam.durationMinutes * 60;
    this.locked = false; // prevents changing answer after selecting

    // Prevent navigating back during the quiz (no retakes)
    this._popHandler = () => {
      // When user hits back, immediately go forward
      history.go(1);
    };
    // Push a history entry and attach handler
    history.pushState(null, "", location.href);
    window.addEventListener("popstate", this._popHandler);

    this.renderQuestion();
    this.startTimer();

    document
      .getElementById("nextBtn")
      .addEventListener("click", () => this.nextQuestion());

    document
      .getElementById("choicesContainer")
      .addEventListener("click", (e) => {
        if (this.locked) return; // don't allow further selections after answer
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
    const q = this.shuffledQuestions[this.currentQ];
    try {
      document.getElementById("qIndex").innerText = `Question ${
        this.currentQ + 1
      } / ${this.shuffledQuestions.length}`;
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
      // Reset selection/visual state and re-enable inputs
      document.querySelectorAll(".answer-row").forEach((r) => {
        r.classList.remove("correct", "incorrect");
      });
      document.querySelectorAll(".choice-btn").forEach((i) => {
        i.checked = false;
        i.disabled = false;
      });
      this.locked = false;
      // Update question text after replacing innerHTML so the qText element exists
      const qTextEl = document.getElementById("qText");
      if (qTextEl) qTextEl.innerText = q.text;

      document.getElementById("nextBtn").disabled = true;
    } catch (err) {
      console.error("renderQuestion failed", err);
    }
  }

  selectAnswer(value, btn) {
    const qId = this.shuffledQuestions[this.currentQ].id;
    this.answers[qId] = value;

    // lock selection for this question
    this.locked = true;

    // disable inputs so user cannot change mind
    document
      .querySelectorAll(".choice-btn")
      .forEach((i) => (i.disabled = true));

    // Mark correct and incorrect rows using classes
    const rows = document.querySelectorAll(".answer-row");
    rows.forEach((r) => {
      const val = r.dataset.value;
      r.classList.remove("correct", "incorrect");
      if (val === this.shuffledQuestions[this.currentQ].correctAnswer) {
        r.classList.add("correct");
      }
      if (
        val === value &&
        val !== this.shuffledQuestions[this.currentQ].correctAnswer
      ) {
        r.classList.add("incorrect");
      }
    });

    // ensure the selected radio is checked
    if (btn) {
      const input = btn.querySelector(".choice-btn");
      if (input) input.checked = true;
    }

    document.getElementById("nextBtn").disabled = false;
  }

  nextQuestion() {
    if (this.currentQ < this.exam.questions.length - 1) {
      this.currentQ++;
      // push a history entry so back navigation is prevented by popstate handler
      history.pushState(null, "", location.href);
      this.renderQuestion();
    } else {
      this.finishExam();
    }
  }

  finishExam() {
    clearInterval(this.interval);
    // remove back-navigation handler when quiz ends
    if (this._popHandler)
      window.removeEventListener("popstate", this._popHandler);

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
