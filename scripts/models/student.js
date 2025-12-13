import User from "./user.js";
export default class Student extends User {
  constructor(grade, mobile, id, username, password, profilePic) {
    super(id, username, "student", password);
    this.grade = grade;
    this.mobile = mobile;
    this.profilePic = profilePic;
  }
}
