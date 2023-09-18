import MessageDto from "./message.dto";


interface ChatDto {
  id?: number, 
  userId: string,
  recipients?: Recipient[],
  messages: Partial<MessageDto>[]
}

export default ChatDto
export type Recipient  = {
  uid: string
}