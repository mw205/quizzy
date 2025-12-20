import User from "./user.js";
export default class Teacher extends User {
  constructor(data) {
    super(data);
    this.courseSubject = data.courseSubject || "General";
  }
}
