import {
  IAddShipRequest,
  IAttackRequest,
  IAttackResponse,
  IRandomAttackRequest,
  IPlayerTurnResponse,
  IShip,
  IStartGameResponse,
  IShipResponse,
} from '../types/types';

type gameId = number;
type indexPlayer = number;
type wsId = number;
type statusCeil = 'miss' | 'killed' | 'shot';
interface IGameDb {
  [key: indexPlayer]: IShipDb[];
}

interface IShipDb {
  position: { x: number; y: number; state: boolean }[];
  spaceAroundShip: { x: number; y: number; state: boolean }[];
  direction: boolean;
  type: 'small' | 'medium' | 'large' | 'huge' | 'none';
  length: number;
}

class SeaBattleGame {
  gameDb: Map<gameId, IGameDb[]>;
  saveRequest: Map<number, IStartGameResponse>;
  currentPlayer: Map<gameId, indexPlayer>;
  wsIdDb: Map<gameId, { [key: indexPlayer]: wsId }>;

  constructor() {
    this.gameDb = new Map();
    this.saveRequest = new Map();
    this.currentPlayer = new Map();
    this.wsIdDb = new Map();
  }

  addShipOnePlayer(data: IAddShipRequest, wsId: number): number | boolean {
    try {
      if (!this.currentPlayer.has(data.gameId)) {
        this.currentPlayer.set(data.gameId, data.indexPlayer);
      }

      const currentPlayer: number = this.currentPlayer.get(data.gameId);
      if (this.wsIdDb.has(data.gameId)) {
        this.wsIdDb.get(data.gameId)[data.indexPlayer] = wsId;
      } else {
        this.wsIdDb.set(data.gameId, { [data.indexPlayer]: wsId });
      }
      console.log(
        'ShipsDb: this.wsIdDb.get(data.gameId)',
        data.gameId,
        this.wsIdDb.get(data.gameId)
      );

      const response = {
        ships: data.ships,
        currentPlayerIndex: currentPlayer,
      };
      console.log('*********');
      console.log('ShipsDb: response', response);
      this.saveRequest.set(wsId, response);

      const allShip = [];

      data.ships.forEach((currentShip) => {
        const ship: IShipDb = {
          position: [],
          spaceAroundShip: [],
          direction: false,
          type: 'none',
          length: 0,
        };

        const responseShips: IShipResponse = {
          position: { x: 0, y: 0 },
          direction: true,
          length: 0,
          type: 'huge',
        };

        const { position, direction, type, length } = currentShip;
        for (let i = 0; i < length; i += 1) {
          ship.position.push({
            x: direction ? position.x : position.x + i,
            y: direction ? position.y + i : position.y,
            state: true,
          });
          if (direction) {
            if (position.x > 0 && position.x < 9) {
              if (position.y > 0 && i === 0) {
                ship.spaceAroundShip.push({ x: position.x - 1, y: position.y - 1, state: true });
                ship.spaceAroundShip.push({ x: position.x, y: position.y - 1, state: true });
                ship.spaceAroundShip.push({ x: position.x + 1, y: position.y - 1, state: true });
              }

              if (position.y < 9 && i === length - 1) {
                ship.spaceAroundShip.push({ x: position.x - 1, y: position.y + 1, state: true });
                ship.spaceAroundShip.push({ x: position.x, y: position.y + 1, state: true });
                ship.spaceAroundShip.push({ x: position.x + 1, y: position.y + 1, state: true });
              }

              ship.spaceAroundShip.push({ x: position.x - 1, y: position.y, state: true });
              ship.spaceAroundShip.push({ x: position.x + 1, y: position.y, state: true });
            }

            if (position.x === 0) {
              if (position.y > 0 && i === 0) {
                ship.spaceAroundShip.push({ x: position.x, y: position.y - 1, state: true });
                ship.spaceAroundShip.push({ x: position.x + 1, y: position.y - 1, state: true });
              }

              if (position.y < 9 && i === length - 1) {
                ship.spaceAroundShip.push({ x: position.x, y: position.y + 1, state: true });
                ship.spaceAroundShip.push({ x: position.x + 1, y: position.y + 1, state: true });
              }

              ship.spaceAroundShip.push({ x: position.x + 1, y: position.y, state: true });
            }

            if (position.x === 9) {
              if (position.y > 0 && i === 0) {
                ship.spaceAroundShip.push({ x: position.x - 1, y: position.y - 1, state: true });
                ship.spaceAroundShip.push({ x: position.x, y: position.y - 1, state: true });
              }

              if (position.y < 9 && i === length - 1) {
                ship.spaceAroundShip.push({ x: position.x - 1, y: position.y + 1, state: true });
                ship.spaceAroundShip.push({ x: position.x, y: position.y + 1, state: true });
              }

              ship.spaceAroundShip.push({ x: position.x - 1, y: position.y, state: true });
              ship.spaceAroundShip.push({ x: position.x + 1, y: position.y, state: true });
            }
          } else {
            if (position.y > 0 && position.y < 9) {
              if (position.x > 0 && i === 0) {
                ship.spaceAroundShip.push({ x: position.x - 1, y: position.y + 1, state: true });
                ship.spaceAroundShip.push({ x: position.x - 1, y: position.y, state: true });
                ship.spaceAroundShip.push({ x: position.x - 1, y: position.y - 1, state: true });
              }

              if (position.x < 9 && i === length - 1) {
                ship.spaceAroundShip.push({ x: position.x + 1, y: position.y + 1, state: true });
                ship.spaceAroundShip.push({ x: position.x + 1, y: position.y, state: true });
                ship.spaceAroundShip.push({ x: position.x + 1, y: position.y - 1, state: true });
              }

              ship.spaceAroundShip.push({ x: position.x, y: position.y - 1, state: true });
              ship.spaceAroundShip.push({ x: position.x, y: position.y + 1, state: true });
            }

            if (position.y === 0) {
              if (position.x > 0 && i === 0) {
                ship.spaceAroundShip.push({ x: position.x - 1, y: position.y, state: true });
                ship.spaceAroundShip.push({ x: position.x - 1, y: position.y + 1, state: true });
              }

              if (position.x < 9 && i === length - 1) {
                ship.spaceAroundShip.push({ x: position.x + 1, y: position.y, state: true });
                ship.spaceAroundShip.push({ x: position.x + 1, y: position.y + 1, state: true });
              }

              ship.spaceAroundShip.push({ x: position.x, y: position.y + 1, state: true });
            }

            if (position.y === 9) {
              if (position.x > 0 && i === 0) {
                ship.spaceAroundShip.push({ x: position.x - 1, y: position.y, state: true });
                ship.spaceAroundShip.push({ x: position.x - 1, y: position.y - 1, state: true });
              }

              if (position.x < 9 && i === length - 1) {
                ship.spaceAroundShip.push({ x: position.x + 1, y: position.y, state: true });
                ship.spaceAroundShip.push({ x: position.x + 1, y: position.y - 1, state: true });
              }

              ship.spaceAroundShip.push({ x: position.x, y: position.y - 1, state: true });
            }
          }
        }
        ship.direction = direction;

        ship.type = type;

        ship.length = length;

        allShip.push(ship);

        responseShips.position.x = position.x;
        responseShips.position.y = position.y;
        responseShips.direction = direction;
        responseShips.length = length;
        responseShips.type = type;
      });

      const playerShip: IGameDb = { [String(data.indexPlayer)]: allShip };

      if (this.gameDb.has(data.gameId)) {
        this.gameDb.get(data.gameId).push(playerShip);
      } else {
        this.gameDb.set(data.gameId, [playerShip]);
      }
      console.log('shipDb: playerShip:', playerShip);
      console.log('shipDb: currentPlayer', currentPlayer);
      console.log('shipDb: player', data.indexPlayer);
      return wsId;
    } catch {
      return false;
    }
  }

  attack(data: IAttackRequest): IAttackResponse {
    try {
      console.log('data to attack', data);

      const currentGameInfo = this.gameDb.get(data.gameId);

      const indexPlayersArr: number[] = [];
      for (const player of currentGameInfo) {
        indexPlayersArr.push(Number(Object.keys(player)[0]));
        console.log(indexPlayersArr);
      }
      let currentStatus: statusCeil = 'miss';
      const anotherIndexPlayer: number = indexPlayersArr.filter(
        (index: number) => index !== data.indexPlayer
      )[0];

      const anotherPlayerIndexOfPlayersArr: number = indexPlayersArr.indexOf(anotherIndexPlayer);

      const shipsofAnotherPlayer: IShipDb[] =
        currentGameInfo[anotherPlayerIndexOfPlayersArr][String(anotherIndexPlayer)];

      for (const ship of shipsofAnotherPlayer) {
        for (const position of ship.position) {
          console.log('position', position);
          if (position.x === data.x && position.y === data.y) {
            console.log("yes, it's hit");
            position.state = false;
            const allStatesAreFalse = ship.position.every((position) => position.state === false);
            currentStatus = allStatesAreFalse ? 'killed' : 'shot';
            console.log('currentStatus', currentStatus);
            return {
              position: {
                x: data.x,
                y: data.y,
              },
              currentPlayer: data.indexPlayer,
              status: currentStatus,
            };
          }
        }
      }
      this.currentPlayer.set(data.gameId, anotherIndexPlayer);
      return {
        position: {
          x: data.x,
          y: data.y,
        },
        currentPlayer: data.indexPlayer,
        status: currentStatus,
      };
    } catch (err) {
      console.log('Something went wrong', err);
    }
  }

  getTurn(gameID: number): IPlayerTurnResponse {
    return {
      currentPlayer: this.currentPlayer.get(gameID),
    };
  }

  getWsId(gameId: number, indexPlayer: number): wsId {
    return this.wsIdDb.get(gameId)[indexPlayer];
  }
  getStartGameResponse(wsId: number): IStartGameResponse {
    return this.saveRequest.get(wsId);
  }
}

export const seaButtle = new SeaBattleGame();
