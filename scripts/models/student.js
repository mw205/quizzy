import User from "./user.js";

export default class Student extends User {
  constructor(data) {
    super(data);
    this.grade = data.grade;
    this.mobile = data.mobile;
    this.profilePic =
      data.profilePic ||
      "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png";
  }
}
