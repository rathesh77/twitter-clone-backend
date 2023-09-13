type User = {
  username: string,
  email: string,
  password: string,
  uid?: string,
  avatar: string,
  banner?: string
}

class UserDto {
  username;
  email;
  password;
  uid?;
  avatar: string
  banner?: string

  constructor(data: User) {

    this.username = data.username
    this.email = data.email
    this.password = data.password
    this.uid = data.uid
    this.avatar = data.avatar
    this.banner = data.banner

  }

}

module.exports = UserDto