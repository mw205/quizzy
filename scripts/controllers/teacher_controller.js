import { ApiService } from '../services/api_service.js';

export default class TeacherController {
  constructor(authService) {
    this.authService = authService;
    this.currentUser = this.authService.requireAuth('teacher');
    this.courses = [];

    if (this.currentUser) {
      this.init();
    }
  }

  async init() {
    const teacherName = document.getElementById('teacherName');
    if (teacherName) teacherName.textContent = this.currentUser.name;

    this.attachEventHandlers();
    this.switchTab('coursesTab');
    await this.loadDashboardData();
  }

  attachEventHandlers() {
    document.querySelectorAll('.nav-btn').forEach((button) => {
      button.addEventListener('click', () => this.switchTab(button.dataset.tab));
    });

    document
      .getElementById('createCourseForm')
      .addEventListener('submit', (event) => this.createCourse(event));

    document
      .getElementById('questionCourseSelect')
      .addEventListener('change', () => this.renderQuestionChapters());

    document
      .getElementById('questionImage')
      .addEventListener('change', (event) => this.uploadQuestionImage(event));

    document
      .getElementById('createQuestionForm')
      .addEventListener('submit', (event) => this.createQuestion(event));

    document
      .getElementById('builderCourseSelect')
      .addEventListener('change', () => {
        this.renderChapterRequirements();
        this.updateConstraintSummary();
      });

    document
      .getElementById('chapterRequirements')
      .addEventListener('input', () => this.updateConstraintSummary());

    document
      .querySelectorAll('.constraint-input')
      .forEach((input) => input.addEventListener('input', () => this.updateConstraintSummary()));

    document
      .getElementById('generateExamBtn')
      .addEventListener('click', () => this.generateExam());

    document
      .getElementById('refreshExamsBtn')
      .addEventListener('click', () => this.loadExams());

    const examsList = document.getElementById('exams-list');
    if (examsList) {
      examsList.addEventListener('click', (e) => {
        const previewBtn = e.target.closest('.btn-preview-exam');
        if (previewBtn) {
          const examId = previewBtn.dataset.id;
          this.previewExam(examId);
        }
      });
    }

    const closeModalBtn = document.getElementById('closePreviewModalBtn');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => this.closePreviewModal());
    }

    const modal = document.getElementById('examPreviewModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closePreviewModal();
      });
    }
  }

  switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach((content) => {
      content.classList.add('hidden');
    });
    document.querySelectorAll('.nav-btn').forEach((button) => {
      button.classList.toggle('active', button.dataset.tab === tabId);
    });
    document.getElementById(tabId)?.classList.remove('hidden');
  }

  async loadDashboardData() {
    try {
      await Promise.all([this.loadCourses(), this.loadExams()]);
    } catch (error) {
      this.setStatus('dashboardStatus', error.message, true);
    }
  }

  async loadCourses() {
    const courseList = document.getElementById('courseList');
    if (courseList) {
      courseList.innerHTML = `
        <div class="text-center py-4 text-muted">
          <div class="spinner-border text-primary mb-2" role="status"></div>
          <div>Loading courses...</div>
        </div>
      `;
    }
    this.courses = await ApiService.getCourses();
    this.renderCourseList();
    this.renderCourseSelects();
  }

  async loadExams() {
    const examsList = document.getElementById('exams-list');
    if (examsList) {
      examsList.innerHTML = `
        <div class="text-center py-4 text-muted">
          <div class="spinner-border text-primary mb-2" role="status"></div>
          <div>Loading generated exams...</div>
        </div>
      `;
    }

    const exams = await ApiService.getExams();

    if (!exams.length) {
      examsList.innerHTML = '<p class="text-muted py-4 text-center">No generated exams created yet.</p>';
      return;
    }

    examsList.innerHTML = exams
      .map(
        (exam) => `
          <article class="card border-0 shadow-sm rounded-4 mb-3 p-3">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h6 class="fw-bold text-dark mb-1">
                  <i class="fa-solid fa-file-lines me-2 text-primary"></i>${this.escapeHtml(exam.course?.name || 'Generated Exam')}
                </h6>
                <div class="text-muted text-sm mb-1">
                  <i class="fa-solid fa-list-check me-1"></i>${exam.totalQuestions} questions
                </div>
                <div class="text-sm fw-semibold ${exam.isExactMatch ? 'text-success' : 'text-warning'}">
                  <i class="fa-solid ${exam.isExactMatch ? 'fa-circle-check' : 'fa-triangle-exclamation'} me-1"></i>
                  ${exam.isExactMatch ? 'Exact Match (Score: 0)' : `Closest Match (Deviation Score: ${exam.score})`}
                </div>
                <div class="text-muted text-xs mt-1">
                  <i class="fa-regular fa-clock me-1"></i>Created ${new Date(exam.createdAt).toLocaleString()}
                </div>
              </div>
              <button class="btn btn-outline-primary btn-sm fw-semibold btn-preview-exam" data-id="${exam.id}">
                <i class="fa-solid fa-eye me-1"></i>Preview Exam
              </button>
            </div>
          </article>
        `,
      )
      .join('');
  }

  async previewExam(examId) {
    const modal = document.getElementById('examPreviewModal');
    const modalTitle = document.getElementById('modalExamTitle');
    const modalBody = document.getElementById('modalExamBody');

    if (!modal || !modalBody) return;

    try {
      modalBody.innerHTML = `
        <div class="text-center py-4 text-muted">
          <div class="spinner-border text-primary mb-2" role="status"></div>
          <div>Fetching exam details...</div>
        </div>
      `;

      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();

      const exam = await ApiService.getExamById(examId);
      if (modalTitle) {
        modalTitle.innerHTML = `<i class="fa-solid fa-file-signature me-2"></i>Preview: ${this.escapeHtml(exam.course?.name || 'Exam')} (${exam.totalQuestions} Questions)`;
      }

      const questions = (exam.examQuestions || []).map((eq) => eq.Question);

      if (!questions.length) {
        modalBody.innerHTML = '<p class="text-muted">No questions found in this exam.</p>';
        return;
      }

      modalBody.innerHTML = `
        <div class="mb-4">
          <span class="badge ${exam.isExactMatch ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle'} px-3 py-2 fs-6">
            <i class="fa-solid ${exam.isExactMatch ? 'fa-circle-check' : 'fa-triangle-exclamation'} me-1"></i>
            ${exam.isExactMatch ? 'Exact Match (Score: 0)' : `Closest Match (Deviation Score: ${exam.score})`}
          </span>
          <span class="text-sm text-muted ms-2"><i class="fa-regular fa-calendar me-1"></i>Created ${new Date(exam.createdAt).toLocaleString()}</span>
        </div>
        <div class="d-flex flex-column gap-3">
          ${questions
            .map(
              (question, index) => `
                <article class="card border-0 shadow-sm rounded-3 p-3 bg-body-tertiary">
                  <h6 class="fw-bold text-dark mb-1">
                    Question ${index + 1}: ${this.escapeHtml(question.text)}
                  </h6>
                  <p class="text-muted text-xs mb-2">
                    <span class="badge bg-secondary-subtle text-secondary me-1">${question.difficulty}</span>
                    <span class="badge bg-info-subtle text-info me-1">${question.objective}</span>
                  </p>
                  ${question.imageUrl ? `<img class="img-fluid rounded mb-2 question-preview" src="${this.escapeHtml(question.imageUrl)}" alt="Question illustration" style="max-height: 200px;" />` : ''}
                  <ol class="question-choice-list text-sm ps-3 mb-0">
                    ${(question.choices || [])
                      .map((choice) => `
                        <li class="py-1 ${choice.isCorrect ? 'fw-bold text-success' : 'text-dark'}">
                          ${this.escapeHtml(choice.text)}
                          ${choice.isCorrect ? ' <i class="fa-solid fa-circle-check text-success ms-1"></i> (Correct)' : ''}
                        </li>
                      `)
                      .join('')}
                  </ol>
                </article>
              `,
            )
            .join('')}
        </div>
      `;
    } catch (error) {
      console.error('Failed to load exam preview:', error);
      modalBody.innerHTML = `<p class="text-danger"><i class="fa-solid fa-circle-xmark me-1"></i>Failed to load exam preview: ${this.escapeHtml(error.message)}</p>`;
    }
  }

  closePreviewModal() {
    const modal = document.getElementById('examPreviewModal');
    if (modal) {
      const bsModal = bootstrap.Modal.getInstance(modal);
      if (bsModal) bsModal.hide();
    }
  }

  renderCourseList() {
    const courseList = document.getElementById('courseList');

    if (!this.courses.length) {
      courseList.innerHTML = '<p class="text-muted py-3 text-center">Create a course to begin building its question bank.</p>';
      return;
    }

    courseList.innerHTML = this.courses
      .map(
        (course) => `
          <article class="card border-0 shadow-sm rounded-4 mb-3 p-4">
            <h5 class="fw-bold text-dark mb-1">
              <i class="fa-solid fa-book me-2 text-primary"></i>${this.escapeHtml(course.name)}
            </h5>
            <p class="text-muted text-sm mb-2">${course.chapterCount} chapter(s)</p>
            <ul class="text-sm ps-3 mb-0 text-muted">
              ${course.chapters
                .map(
                  (chapter) =>
                    `<li class="mb-1">Chapter ${chapter.number}: <strong class="text-dark">${this.escapeHtml(chapter.title)}</strong> (${chapter._count.questions} questions available)</li>`,
                )
                .join('')}
            </ul>
          </article>
        `,
      )
      .join('');
  }

  renderCourseSelects() {
    this.populateCourseSelect('questionCourseSelect');
    this.populateCourseSelect('builderCourseSelect');
    this.renderQuestionChapters();
    this.renderChapterRequirements();
    this.updateConstraintSummary();
  }

  populateCourseSelect(id) {
    const select = document.getElementById(id);
    const previousValue = select.value;

    select.innerHTML = this.courses.length
      ? this.courses
          .map(
            (course) =>
              `<option value="${course.id}">${this.escapeHtml(course.name)} (${course.chapterCount} chapters)</option>`,
          )
          .join('')
      : '<option value="">No courses available</option>';

    if (this.courses.some((course) => course.id === previousValue)) {
      select.value = previousValue;
    }
  }

  renderQuestionChapters() {
    const course = this.getSelectedCourse('questionCourseSelect');
    const select = document.getElementById('questionChapterSelect');

    select.innerHTML = course
      ? course.chapters
          .map(
            (chapter) =>
              `<option value="${chapter.id}">Chapter ${chapter.number}: ${this.escapeHtml(chapter.title)}</option>`,
          )
          .join('')
      : '<option value="">Select a course first</option>';
  }

  renderChapterRequirements() {
    const course = this.getSelectedCourse('builderCourseSelect');
    const container = document.getElementById('chapterRequirements');

    if (!course) {
      container.innerHTML = '<p class="text-muted">Create and select a course first.</p>';
      return;
    }

    container.innerHTML = course.chapters
      .map(
        (chapter) => `
          <div class="mb-2">
            <label class="form-label text-sm fw-semibold" for="chapter-${chapter.id}">
              Chapter ${chapter.number}: ${this.escapeHtml(chapter.title)} (${chapter._count.questions} available)
            </label>
            <input
              id="chapter-${chapter.id}"
              class="form-control chapter-requirement"
              data-chapter-id="${chapter.id}"
              type="number"
              min="0"
              max="${chapter._count.questions}"
              value="0"
            />
          </div>
        `,
      )
      .join('');
  }

  async createCourse(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;

    try {
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Creating course...';

      await ApiService.createCourse({
        title: form.title.value.trim(),
        chapterCount: Number(form.chapterCount.value),
      });
      form.reset();
      await this.loadCourses();
      this.setStatus('courseStatus', 'Course and chapters created successfully.');
    } catch (error) {
      this.setStatus('courseStatus', error.message, true);
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    }
  }

  async uploadQuestionImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      this.setStatus('questionStatus', 'Uploading image…');
      const response = await ApiService.uploadImage(file);
      const imageUrl = typeof response === 'string' ? response : response.imageUrl;
      document.getElementById('questionImageUrl').value = imageUrl;
      this.setStatus('questionStatus', 'Image uploaded. It will be attached when you save the question.');
    } catch (error) {
      this.setStatus('questionStatus', error.message, true);
    }
  }

  async createQuestion(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const choices = [...form.querySelectorAll('[name="choice"]')].map((input, index) => ({
      text: input.value.trim(),
      isCorrect: index === Number(form.correctChoice.value),
    }));
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;

    try {
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Saving question...';

      await ApiService.createQuestion({
        chapterId: form.chapterId.value,
        text: form.text.value.trim(),
        imageUrl: form.imageUrl.value || undefined,
        difficulty: form.difficulty.value,
        objective: form.objective.value,
        choices,
      });
      form.reset();
      document.getElementById('questionImageUrl').value = '';
      await this.loadCourses();
      this.setStatus('questionStatus', 'Question saved to the backend question bank.');
    } catch (error) {
      this.setStatus('questionStatus', error.message, true);
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    }
  }

  updateConstraintSummary() {
    const chapterTotal = [...document.querySelectorAll('.chapter-requirement')].reduce(
      (sum, input) => sum + Number(input.value || 0),
      0,
    );
    const difficultyTotal = Number(document.getElementById('simpleReq').value || 0) +
      Number(document.getElementById('difficultReq').value || 0);
    const objectiveTotal = Number(document.getElementById('remReq').value || 0) +
      Number(document.getElementById('undReq').value || 0) +
      Number(document.getElementById('creReq').value || 0);

    document.getElementById('totalsSummary').textContent =
      `Chapters: ${chapterTotal} | Difficulty: ${difficultyTotal} | Objectives: ${objectiveTotal}`;

    const feedback = document.getElementById('constraintFeedback');
    const valid = chapterTotal > 0 && chapterTotal === difficultyTotal && difficultyTotal === objectiveTotal;
    feedback.innerHTML = valid
      ? `<i class="fa-solid fa-circle-check text-success me-1"></i>All target totals match (${chapterTotal} questions)`
      : '<i class="fa-solid fa-circle-xmark text-danger me-1"></i>Totals must be equal and greater than zero.';
    feedback.className = `text-sm font-bold ${valid ? 'text-success' : 'text-danger'}`;
  }

  async generateExam() {
    const course = this.getSelectedCourse('builderCourseSelect');
    if (!course) {
      this.setStatus('builderStatus', 'Create and select a course first.', true);
      return;
    }

    const chapterRequirements = Object.fromEntries(
      [...document.querySelectorAll('.chapter-requirement')].map((input) => [
        input.dataset.chapterId,
        Number(input.value || 0),
      ]),
    );

    const request = {
      courseId: course.id,
      chapterRequirements,
      difficultyRequirements: {
        simple: Number(document.getElementById('simpleReq').value || 0),
        difficult: Number(document.getElementById('difficultReq').value || 0),
      },
      objectiveRequirements: {
        remembering: Number(document.getElementById('remReq').value || 0),
        understanding: Number(document.getElementById('undReq').value || 0),
        creativity: Number(document.getElementById('creReq').value || 0),
      },
    };

    const button = document.getElementById('generateExamBtn');
    const originalText = button.innerHTML;

    try {
      button.disabled = true;
      button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Generating optimum recommendation...';

      const result = await ApiService.generateOptimumExam(request);
      this.renderGeneratedExam(result, course, request);
      await this.loadExams();
      this.setStatus('builderStatus', 'Exam recommendation generated and saved.');
    } catch (error) {
      this.setStatus('builderStatus', error.message, true);
    } finally {
      button.disabled = false;
      button.innerHTML = originalText;
    }
  }

  renderGeneratedExam(result, course, request) {
    const chapterNames = new Map(course.chapters.map((chapter) => [chapter.id, `Chapter ${chapter.number}`]));
    const actualChapters = result.questions.reduce((counts, question) => {
      counts[question.chapterId] = (counts[question.chapterId] || 0) + 1;
      return counts;
    }, {});

    const rows = [
      ...Object.entries(request.chapterRequirements).map(([chapterId, requested]) => ({
        label: `${chapterNames.get(chapterId) || 'Chapter'} questions`,
        requested,
        actual: actualChapters[chapterId] || 0,
      })),
      { label: 'Simple difficulty', requested: request.difficultyRequirements.simple, actual: result.actualDistribution.difficulty.simple },
      { label: 'Difficult difficulty', requested: request.difficultyRequirements.difficult, actual: result.actualDistribution.difficulty.difficult },
      { label: 'Remembering objective', requested: request.objectiveRequirements.remembering, actual: result.actualDistribution.objective.remembering },
      { label: 'Understanding objective', requested: request.objectiveRequirements.understanding, actual: result.actualDistribution.objective.understanding },
      { label: 'Creativity objective', requested: request.objectiveRequirements.creativity, actual: result.actualDistribution.objective.creativity },
    ];

    const badge = document.getElementById('matchScoreBadge');
    badge.innerHTML = result.isExactMatch
      ? '<i class="fa-solid fa-circle-check me-1"></i>Exact match (score: 0)'
      : `<i class="fa-solid fa-triangle-exclamation me-1"></i>Closest match (score: ${result.score})`;
    badge.className = `badge fs-6 p-2 ${result.isExactMatch ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle'}`;

    document.getElementById('distributionSummaryBody').innerHTML = rows
      .map(
        (row) => `
          <tr>
            <td>${this.escapeHtml(row.label)}</td>
            <td>${row.requested}</td>
            <td>${row.actual}</td>
            <td>${row.requested === row.actual ? '<span class="text-success"><i class="fa-solid fa-circle-check me-1"></i>Met</span>' : '<span class="text-warning"><i class="fa-solid fa-triangle-exclamation me-1"></i>Difference</span>'}</td>
          </tr>
        `,
      )
      .join('');

    document.getElementById('generatedQuestionsList').innerHTML = result.questions
      .map(
        (question, index) => `
          <article class="card border-0 shadow-sm rounded-3 mb-2 p-3 bg-body-tertiary">
            <h6 class="fw-bold text-dark mb-1">
              Question ${index + 1}: ${this.escapeHtml(question.text)}
            </h6>
            <p class="text-muted text-xs mb-2">${this.escapeHtml(chapterNames.get(question.chapterId) || 'Chapter')} · ${question.difficulty} · ${question.objective}</p>
            ${question.imageUrl ? `<img class="img-fluid rounded mb-2 question-preview" src="${this.escapeHtml(question.imageUrl)}" alt="Question illustration" style="max-height: 200px;" />` : ''}
            <ol class="question-choice-list text-sm ps-3 mb-0">
              ${question.choices
                .map((choice) => `
                  <li class="${choice.isCorrect ? 'fw-bold text-success' : ''}">
                    ${this.escapeHtml(choice.text)}
                    ${choice.isCorrect ? ' <i class="fa-solid fa-circle-check text-success ms-1"></i>' : ''}
                  </li>
                `)
                .join('')}
            </ol>
          </article>
        `,
      )
      .join('');

    document.getElementById('generatedExamOutput').classList.remove('hidden');
  }

  getSelectedCourse(selectId) {
    const id = document.getElementById(selectId).value;
    return this.courses.find((course) => course.id === id);
  }

  setStatus(id, message, isError = false) {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = message;
    element.className = `text-sm ${isError ? 'text-danger' : 'text-success'}`;
  }

  escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
