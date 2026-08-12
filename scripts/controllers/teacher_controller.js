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
    this.courses = await ApiService.getCourses();
    this.renderCourseList();
    this.renderCourseSelects();
  }

  async loadExams() {
    const exams = await ApiService.getExams();
    const examsList = document.getElementById('exams-list');

    if (!exams.length) {
      examsList.innerHTML = '<p class="text-muted">No generated exams yet.</p>';
      return;
    }

    examsList.innerHTML = exams
      .map(
        (exam) => `
          <article class="card mb-2">
            <strong>Generated exam</strong>
            <p class="text-muted text-sm">${this.escapeHtml(exam.course.name)} · ${exam.totalQuestions} questions</p>
            <p class="text-sm">${exam.isExactMatch ? '✅ Exact match' : '⚠️ Closest match'} · Deviation score: ${exam.score}</p>
            <p class="text-sm text-muted">Created ${new Date(exam.createdAt).toLocaleString()}</p>
          </article>
        `,
      )
      .join('');
  }

  renderCourseList() {
    const courseList = document.getElementById('courseList');

    if (!this.courses.length) {
      courseList.innerHTML = '<p class="text-muted">Create a course to begin building its question bank.</p>';
      return;
    }

    courseList.innerHTML = this.courses
      .map(
        (course) => `
          <article class="card mb-2">
            <strong>${this.escapeHtml(course.name)}</strong>
            <p class="text-muted text-sm">${course.chapterCount} chapter(s)</p>
            <ul class="text-sm">
              ${course.chapters
                .map(
                  (chapter) =>
                    `<li>Chapter ${chapter.number}: ${this.escapeHtml(chapter.title)} (${chapter._count.questions} questions)</li>`,
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
            <label class="text-sm" for="chapter-${chapter.id}">Chapter ${chapter.number}: ${this.escapeHtml(chapter.title)} (${chapter._count.questions} available)</label>
            <input
              id="chapter-${chapter.id}"
              class="w-full p-1 border rounded chapter-requirement"
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

    try {
      submitButton.disabled = true;
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

    try {
      submitButton.disabled = true;
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
    feedback.textContent = valid
      ? `✅ All target totals match (${chapterTotal} questions)`
      : '❌ Totals must be equal and greater than zero.';
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
    try {
      button.disabled = true;
      const result = await ApiService.generateOptimumExam(request);
      this.renderGeneratedExam(result, course, request);
      await this.loadExams();
      this.setStatus('builderStatus', 'Exam recommendation generated and saved.');
    } catch (error) {
      this.setStatus('builderStatus', error.message, true);
    } finally {
      button.disabled = false;
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
    badge.textContent = result.isExactMatch
      ? 'Exact match (score: 0)'
      : `Closest match (score: ${result.score})`;
    badge.className = `badge text-sm p-2 ${result.isExactMatch ? 'text-success' : 'text-danger'}`;

    document.getElementById('distributionSummaryBody').innerHTML = rows
      .map(
        (row) => `
          <tr>
            <td>${this.escapeHtml(row.label)}</td>
            <td>${row.requested}</td>
            <td>${row.actual}</td>
            <td>${row.requested === row.actual ? '✅ Met' : '⚠️ Difference'}</td>
          </tr>
        `,
      )
      .join('');

    document.getElementById('generatedQuestionsList').innerHTML = result.questions
      .map(
        (question, index) => `
          <article class="card mb-2">
            <strong>Question ${index + 1}: ${this.escapeHtml(question.text)}</strong>
            <p class="text-muted text-sm">${this.escapeHtml(chapterNames.get(question.chapterId) || 'Chapter')} · ${question.difficulty} · ${question.objective}</p>
            ${question.imageUrl ? `<img class="question-preview" src="${this.escapeHtml(question.imageUrl)}" alt="Question illustration" />` : ''}
            <ol class="question-choice-list">
              ${question.choices
                .map((choice) => `<li>${this.escapeHtml(choice.text)}${choice.isCorrect ? ' ✅' : ''}</li>`)
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
