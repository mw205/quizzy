class Exam {
  constructor(
    id,
    creatorId,
    title,
    durationMinuts,
    questionCount,
    totalScore,
    questions
  ) {
    this.id = id;
    this.creatorId = creatorId;
    this.title = title;
    this.durationMinuts = durationMinuts;
    this.questionCount = questionCount;
    this.totalScore = totalScore;
    this.questions = questions;
  }
}
class Question {
  constructor(id, text, image, options, correctAnswer, difficulty, score) {
    this.id = id;
    this.text = text;
    this.image = image;
    this.options = options;
    this.correctAnswer = correctAnswer;
    this.difficulty = difficulty;
    this.score = score;
  }
}
export { Exam, Question };
