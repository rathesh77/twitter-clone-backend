import type { IncomingMessage } from 'http';
import type { SessionData } from 'express-session';
import type { Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

declare module 'node:http' {
  interface IncomingMessage {
    session: {[key: string]: string}
  }
}