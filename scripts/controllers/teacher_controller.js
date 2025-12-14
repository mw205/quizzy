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
}
