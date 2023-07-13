import Websocket, { WebSocketServer } from 'ws';
import { parseUserData } from '../processing/parseUserData';
import { currentGameRooms } from '../database/GameRooms';
import { IAddShipRequest, IServerResponse2, IUserRequest2 } from '../types/types';
import { seaButtle } from '../database/ShipsDb';

type gameid = number;
type wsIdFirstPlayer = number;
type wsIdSecondPlayer = number;
type connectId = number;
const gameInfo = new Map<gameid, [wsIdFirstPlayer, wsIdSecondPlayer?]>();
let wsId = 0;
const connectedWs = new Map<connectId, Websocket>();

export const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', (ws: Websocket) => {
  wsId = wsId + 1;
  const connectId = wsId;
  connectedWs.set(connectId, ws);
  ws.on('message', (buffer: Buffer) => {
    console.log('////////////////////////////////');
    console.log('msg from user: ', JSON.parse(buffer.toString()));
    const userRequest: IUserRequest2 = JSON.parse(buffer.toString());

    const serverAnswer = parseUserData(userRequest, connectId);
    console.log('info from server: ', JSON.stringify(serverAnswer));

    if (userRequest.type === 'add_ships') {
      const requestData = JSON.parse(userRequest.data) as IAddShipRequest;
      const wsIdIfShipAddToDb = seaButtle.addShipOnePlayer(requestData, connectId);

      if (typeof wsIdIfShipAddToDb === 'number') {
        if (gameInfo.has(requestData.gameId)) {
          gameInfo.get(requestData.gameId)[1] = wsIdIfShipAddToDb;
          const wsIdsPlayers = gameInfo.get(requestData.gameId);

          if (wsIdsPlayers[0] !== wsIdsPlayers[1]) {
            for (let i = 0; i < wsIdsPlayers.length; i++) {
              const gameAnswer = seaButtle.getStartGameResponse(wsIdsPlayers[i]);
              const serverResponse = {
                type: 'start_game',
                data: JSON.stringify(gameAnswer),
                id: 0,
              };

              connectedWs.get(wsIdsPlayers[i]).send(JSON.stringify(serverResponse));
            }
          }
        } else {
          gameInfo.set(requestData.gameId, [wsIdIfShipAddToDb]);
        }
      }
    } else {
      ws.send(JSON.stringify(serverAnswer));
    }
    try {
      connectedWs.forEach((connect, innerConnectId) => {
        if (connect !== ws && serverAnswer.type === 'update_room') {
          connect.send(JSON.stringify(serverAnswer));
          //Todo update winners after reg
        }
        if (serverAnswer.type === 'create_game') {
          const idCurrentGame = JSON.parse(serverAnswer.data).idGame;
          console.log('idCurrentGame', idCurrentGame);
          const idCurrentRoom = JSON.parse(userRequest.data).indexRoom as number;
          console.log('idCurrentRoom', idCurrentRoom);
          const wsInCurrentRoom: number[] =
            currentGameRooms.getWsIdsinOneRoomByRoomIndex(idCurrentRoom);
          console.log('wsInCurrentRoom', wsInCurrentRoom);
          if (wsInCurrentRoom.includes(innerConnectId) && innerConnectId !== connectId) {
            const idSecondUser = currentGameRooms.getUserIdsinOneRoomByRoomIndex(idCurrentRoom)[0];
            console.log('idSecondUser', idSecondUser);

            const dataForCreateGame = {
              idGame: idCurrentGame,
              idPlayer: idSecondUser,
            };
            console.log('dataForCreateGame', dataForCreateGame);

            const createGame = {
              type: 'create_game',
              data: JSON.stringify(dataForCreateGame),
              id: 0,
            };

            connect.send(JSON.stringify(createGame));
          }

          const updateRoom = {
            type: 'update_room',
            data: JSON.stringify(currentGameRooms.updateRoom()),
            id: 0,
          };
          connect.send(JSON.stringify(updateRoom));
        }
        if (serverAnswer.type === 'attack') {
          const gameId = JSON.parse(userRequest.data).gameId;
          console.log('gameId', gameId);
          const whomNextTurn = seaButtle.currentPlayer.get(gameId);
          console.log('whomNextTurn', whomNextTurn);
          const wsIdNextPlayer = seaButtle.wsIdDb.get(gameId)[whomNextTurn];
          console.log('wsIdNextPlayer', wsIdNextPlayer);
          const wsIdcurrentPlayer = Object.values(seaButtle.wsIdDb.get(gameId)).filter(
            (wsId) => wsId !== wsIdNextPlayer
          )[0];
          console.log(wsIdcurrentPlayer);
          const newServerAnswer: IServerResponse2 = {
            type: 'turn',
            data: JSON.stringify(seaButtle.getTurn(gameId)),
            id: 0,
          };
          if (innerConnectId === wsIdNextPlayer || innerConnectId === wsIdcurrentPlayer) {
            connect.send(JSON.stringify(newServerAnswer));
          }
        }
      });
    } catch (err) {
      console.log('Something went wrong', err);
    }
  });

  ws.on('close', () => {
    console.log('WS closed');
  });

  ws.on('error', (err) => {
    console.log('error:', err);
  });
});
