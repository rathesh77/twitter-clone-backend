type Recipient = {
  uid: string
}
type Chat = {
  id: number, 
  authorId: number,
  recipients?: Recipient[]
}
class ChatDto {

  id;
  authorId;
  recipients;

  constructor(data: Chat) {
    this.id = data.id
    this.authorId = data.authorId
    this.recipients = data.recipients ? data.recipients : []

  }

}

module.exports = ChatDto