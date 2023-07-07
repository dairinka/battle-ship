import Websocket, { WebSocketServer } from 'ws';
import { parseUserData } from '../processing/parseUserData';

export const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', (ws: Websocket) => {
  console.log('Websocket connection');

  ws.on('message', (buffer: Buffer) => {
    console.log('msg from user: ', JSON.parse(buffer.toString()));
    parseUserData(JSON.parse(buffer.toString()));

    ws.send(JSON.stringify({ message: 'Received your msg' }));
  });

  ws.on('close', () => {
    console.log('WS closed');
  });

  ws.on('error', (err) => {
    console.log('error:', err);
  });
});
