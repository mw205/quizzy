class Exam {
  constructor(data) {
    this.id = data.id;
    this.creatorId = data.creatorId;
    this.title = data.title;
    this.durationMinutes = parseInt(data.durationMinutes);
    this.questions = questions;
  }
  get totalScore() {
    return this.questions.reduce(
      (total, question) => total + question.score,
      0
    );
  }
  get questionsCount() {
    return this.questions.length;
  }
}
class Question {
  constructor(data) {
    this.id = data.id;
    this.text = data.text;
    this.image = data.image || null;
    this.options = data.options || [];
    this.correctAnswer = data.correctAnswer;
    this.difficulty = data.difficulty || "easy";
    this.score = data.score || 1;
  }
}
export { Exam, Question };
