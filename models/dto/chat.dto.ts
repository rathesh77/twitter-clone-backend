type Recipient = {
  uid: string
}
type Chat = {
  id?: number, 
  userId: string,
  recipients?: Recipient[]
}
class ChatDto {

  id?;
  userId;
  recipients?;

  constructor(data: Chat) {
    this.id = data.id
    this.userId = data.userId
    this.recipients = data.recipients ? data.recipients : []
    
  }

}

module.exports = ChatDto