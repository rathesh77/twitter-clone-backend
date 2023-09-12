type Message = {
  id: number,
  content: string,
  userId: number,
  chatId: number,
  date: number
}

class MessageDto {

  id;
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

module.exports = MessageDto