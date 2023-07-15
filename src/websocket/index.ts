import Websocket, { WebSocketServer } from 'ws';
import { parseUserData } from '../processing/parseUserData';
import { currentGameRooms } from '../database/GameRooms';
import { IAddShipRequest, IServerResponse2, IUpdateWinner, IUserRequest2 } from '../types/types';
import { seaButtle } from '../database/ShipsDb';
import { currentUserDb } from '../database/UsersDb';

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
    const userRequest: IUserRequest2 = JSON.parse(buffer.toString());

    const serverAnswer = parseUserData(userRequest, connectId);

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

              const turnAnswer: IServerResponse2 = {
                type: 'turn',
                data: JSON.stringify(seaButtle.getTurn(requestData.gameId)),
                id: 0,
              };
              const winData: IUpdateWinner[] = currentUserDb.getAllWinners();

              const updateWin: IServerResponse2 = {
                type: 'update_winners',
                data: JSON.stringify(winData),
                id: 0,
              };

              connectedWs.get(wsIdsPlayers[i]).send(JSON.stringify(serverResponse));
              connectedWs.get(wsIdsPlayers[i]).send(JSON.stringify(updateWin));
              connectedWs.get(wsIdsPlayers[i]).send(JSON.stringify(turnAnswer));
            }
          }
        } else {
          gameInfo.set(requestData.gameId, [wsIdIfShipAddToDb]);
        }
      }
    } else if (
      (userRequest.type === 'attack' || userRequest.type === 'randomAttack') &&
      Array.isArray(serverAnswer)
    ) {
      const gameId = JSON.parse(userRequest.data).gameId;

      const wsIdArr = gameInfo.get(gameId);
      wsIdArr.forEach((wsid) => {
        serverAnswer.forEach((answer) => {
          connectedWs.get(wsid).send(JSON.stringify(answer));
        });
      });

      const currentPlayer = JSON.parse(userRequest.data).indexPlayer;
      const anotherPlayer = seaButtle
        .getIndexesPlayersByGameId(gameId)
        .find((ind) => ind !== currentPlayer);
      const isGameOver = seaButtle.isGameFinish(gameId, anotherPlayer);

      if (isGameOver) {
        const newServerAnswer: IServerResponse2 = {
          type: 'finish',
          data: JSON.stringify({ winPlayer: currentPlayer }),
          id: 0,
        };
        const currentUserName = currentUserDb.getUserNameByIndexPlayer(currentPlayer);

        currentUserDb.addWinToUserByName(currentUserName);

        const winData: IUpdateWinner[] = currentUserDb.getAllWinners();

        const updateWin: IServerResponse2 = {
          type: 'update_winners',
          data: JSON.stringify(winData),
          id: 0,
        };
        const currentRoom = currentGameRooms.getRoomNumberByIdGame(gameId);
        currentGameRooms.closeRoom(currentRoom);
        wsIdArr.forEach((wsid) => {
          connectedWs.get(wsid).send(JSON.stringify(newServerAnswer));
          connectedWs.get(wsid).send(JSON.stringify(updateWin));
        });
      } else {
        const newServerAnswer: IServerResponse2 = {
          type: 'turn',
          data: JSON.stringify(seaButtle.getTurn(gameId)),
          id: 0,
        };
        wsIdArr.forEach((wsid) => {
          connectedWs.get(wsid).send(JSON.stringify(newServerAnswer));
        });
      }
    } else {
      ws.send(JSON.stringify(serverAnswer));
    }
    try {
      connectedWs.forEach((connect, innerConnectId) => {
        if (!Array.isArray(serverAnswer) && connect !== ws && serverAnswer.type === 'update_room') {
          connect.send(JSON.stringify(serverAnswer));
        }
        if (!Array.isArray(serverAnswer) && serverAnswer.type === 'create_game') {
          const idCurrentGame = JSON.parse(serverAnswer.data).idGame;
          const idCurrentRoom = JSON.parse(userRequest.data).indexRoom as number;
          const wsInCurrentRoom: number[] =
            currentGameRooms.getWsIdsinOneRoomByRoomIndex(idCurrentRoom);

          if (wsInCurrentRoom.includes(innerConnectId) && innerConnectId !== connectId) {
            const idSecondUser = currentGameRooms.getUserIdsinOneRoomByRoomIndex(idCurrentRoom)[0];

            const dataForCreateGame = {
              idGame: idCurrentGame,
              idPlayer: idSecondUser,
            };

            const createGame: IServerResponse2 = {
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
        if (userRequest.type === 'attack') {
        }
      });
    } catch (err) {
      console.log('Something went wrong');
    }
  });

  ws.on('close', () => {
    console.log('WS closed');
  });

  ws.on('error', (err) => {
    console.log('error');
  });
});
