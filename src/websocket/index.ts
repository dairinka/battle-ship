import Websocket, { WebSocketServer } from 'ws';
import { parseUserData } from '../processing/parseUserData';
let wsId = 0;
const connectedWs = new Map<number, Websocket>();

export const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', (ws: Websocket) => {
  console.log('Websocket connection');
  wsId = wsId + 1;
  const connectId = wsId;
  connectedWs.set(connectId, ws);
  ws.on('message', (buffer: Buffer) => {
    console.log('msg from user: ', JSON.parse(buffer.toString()));
    const serverAnswer = parseUserData(JSON.parse(buffer.toString()), connectId);

    console.log('info from server: ', JSON.stringify(serverAnswer));
    ws.send(JSON.stringify(serverAnswer));

    connectedWs.forEach((connect) => {
      if (connect !== ws && serverAnswer.type === 'update_room') {
        connect.send(JSON.stringify(serverAnswer));
      }
    });
  });

  ws.on('close', () => {
    console.log('WS closed');
  });

  ws.on('error', (err) => {
    console.log('error:', err);
  });
});
