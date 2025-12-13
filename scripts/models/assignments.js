export default class Assignments {
  constructor(data) {
    this.id = data.id;
    this.creatorId = data.creatorId;
    this.examId = data.examId;
    this.studentId = data.studentId;
    this.status = data.status || "pending";
    this.date = data.date || new Date().toISOString();
  }
}
