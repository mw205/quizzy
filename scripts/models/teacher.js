import User from "./user.js";
export default class Teacher extends User {
  constructor(id, username, password, courseSubject) {
    super(id, username, "teacher", password);
    this.courseSubject = courseSubject;
  }
}
