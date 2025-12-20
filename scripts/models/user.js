export default class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.role = data.role;
    this.password = data.password;
  }
}
