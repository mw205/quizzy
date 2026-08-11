const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : 'https://quizzy-backend.onrender.com'; // Production Render API URL

export class ApiService {
  /**
   * Fetch all questions belonging to a specific chapter from NestJS backend
   */
  static async getQuestionsByChapter(chapterId) {
    try {
      const res = await fetch(`${API_BASE_URL}/questions/chapter/${chapterId}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API Error (getQuestionsByChapter): Falling back to client state', err);
      return null;
    }
  }

  /**
   * Create a new question with 3 choices, difficulty, and objective
   */
  static async createQuestion(questionData) {
    try {
      const res = await fetch(`${API_BASE_URL}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create question');
      }
      return await res.json();
    } catch (err) {
      console.warn('API Error (createQuestion):', err);
      throw err;
    }
  }

  /**
   * Run multi-dimensional constraint-matching algorithm to generate an optimum exam
   */
  static async generateOptimumExam(specifications) {
    try {
      const res = await fetch(`${API_BASE_URL}/exams/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(specifications),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to generate optimum exam');
      }
      return await res.json();
    } catch (err) {
      console.warn('API Error (generateOptimumExam):', err);
      throw err;
    }
  }

  /**
   * Fetch all generated exams
   */
  static async getExams() {
    try {
      const res = await fetch(`${API_BASE_URL}/exams`);
      if (!res.ok) throw new Error('Failed to fetch exams');
      return await res.json();
    } catch (err) {
      console.warn('API Error (getExams):', err);
      return null;
    }
  }

  /**
   * Upload question diagram image to Cloudinary via NestJS backend
   */
  static async uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Image upload failed');
      const data = await res.json();
      return data.imageUrl;
    } catch (err) {
      console.warn('API Error (uploadImage):', err);
      throw err;
    }
  }
}
