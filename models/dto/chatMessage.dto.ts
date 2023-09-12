type ChatMessage = {
  chat: ChatDto, 
  message: MessageDto
}

class ChatMessageDto {

  chat;
  message;

  constructor(data: ChatMessage) {
    this.chat = data.chat
    this.message = data.message
  }

}

module.exports = ChatMessageDto