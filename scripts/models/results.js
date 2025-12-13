export default class Results {
  constructor(data) {
    this.id = data.id;
    this.studentId = data.studentId;
    this.examId = data.examId;
    this.score = data.score;
    this.totalScore = data.totalScore;
    this.date = data.date || new Date().toISOString();
    this.answers = data.answers || {};
  }
}
