type User = {
  id?: number,
  username: string,
  email: string,
  password: string,
  uid: string,
  avatar: string
}

class UserDto {
  id;
  username;
  email;
  password;
  uid;
  avatar: string
  
  constructor(data: User) {
    this.id = data.id

    this.username = data.username
    this.email = data.email
    this.password = data.password
    this.uid = data.uid
    this.avatar = data.avatar

  }

}

module.exports = UserDto