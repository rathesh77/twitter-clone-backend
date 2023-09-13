type ChatMessage = {
  id? : number
  chatId: number, 
  messageId: number
}

class ChatMessageDto {
  id?;
  chatId;
  messageId;

  constructor(data: ChatMessage) {
    this.id = data.id

    this.chatId = data.chatId
    this.messageId = data.messageId
  }

}

module.exports = ChatMessageDto