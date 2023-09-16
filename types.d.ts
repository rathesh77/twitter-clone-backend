export declare module 'http' {
 interface IncomingMessage {
    session: {[key: string]: string}
  }
};

export declare module 'express-session' {
  interface IncomingMessage {
    session: {[key: string]: string}
  }
};