import MessageInterface from "../../interface/message.interface";
import MessageDto from "../dto/message.dto";

class MessageDao implements MessageInterface {

  implementation: MessageInterface

  constructor(implementation: MessageInterface) {
    this.implementation = implementation
  }

 async create(message: MessageDto) {
    return await this.implementation.create(message)
  }

}

export default MessageDao