interface MessageRequest {
  content: string,
  userId: string,
  chatId?: number,
}

export default MessageRequest