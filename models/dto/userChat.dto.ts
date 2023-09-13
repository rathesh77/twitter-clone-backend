type UserChat = {
  id?: number,
  userId: string, 
  chatId: number
}

class UserChatDto {
  id;
  userId;
  chatId;

  constructor(data: UserChat) {
    this.id = data.id
    this.userId = data.userId
    this.chatId = data.chatId
  }

}

export default UserChatDto