import MessageInterface from "../../interface/message.interface";
import MessageDto from "../dto/message.dto";
import MessageRequest from "../request/message.request";

class MessageDao implements MessageInterface {

  implementation: MessageInterface

  constructor(implementation: MessageInterface) {
    this.implementation = implementation
  }

 async create(message: MessageRequest) {
    return await this.implementation.create(message)
  }

}

export default MessageDao