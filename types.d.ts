/* eslint-disable @typescript-eslint/no-explicit-any */
export declare module 'http' {
 interface IncomingMessage {
    session: {[key: string]: string | any}
  }
}

export declare module 'express-session' {
  interface IncomingMessage {
    session: {[key: string]: string}
  }
}