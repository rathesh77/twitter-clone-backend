type Message = {
  id?: number,
  content: string,
  userId: string,
  chatId: number,
  date: number
}

class MessageDto {

  id?;
  content;
  userId;
  chatId;
  date;

  constructor(data: Message) {
    this.id = data.id
    this.content = data.content
    this.userId = data.userId
    this.chatId = data.chatId
    this.date = data.date

  }

}

export default MessageDto