type ChatMessage = {
  chatId: number, 
  messageId: number
}

class ChatMessageDto {

  chatId;
  messageId;

  constructor(data: ChatMessage) {
    this.chatId = data.chatId
    this.messageId = data.messageId
  }

}

module.exports = ChatMessageDto