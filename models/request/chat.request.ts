import MessageRequest from './message.request';

type Recipient = {
  uid: string
}

interface ChatRequest {
  userId: string,
  recipients?: Recipient[],
  messages: MessageRequest[]
}

export default ChatRequest;