interface MessageDto {
  id?: number,
  content: string,
  userId: string,
  chatId: number,
  date: number
}

export default MessageDto