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
interface IPosition {
  x: number;
  y: number;
}
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
type shot = 0 | 1;

class SeaBattleGame {
  gameDb: Map<gameId, IGameDb[]>;
  saveRequest: Map<number, IStartGameResponse>;
  currentPlayer: Map<gameId, indexPlayer>;
  wsIdDb: Map<gameId, { [key: indexPlayer]: wsId }>;
  shotDb: Map<gameId, { [key: indexPlayer]: shot[][] }>;

  constructor() {
    this.gameDb = new Map();
    this.saveRequest = new Map();
    this.currentPlayer = new Map();
    this.wsIdDb = new Map();
    this.shotDb = new Map();
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

      const response = {
        ships: data.ships,
        currentPlayerIndex: currentPlayer,
      };

      this.saveRequest.set(wsId, response);

      this.createPlayerShotDb(data.gameId, data.indexPlayer);
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
        }

        for (let i = 0; i < ship.position.length; i += 1) {
          const newposition = ship.position[i];
          if (direction) {
            if (newposition.x > 0 && newposition.x < 9) {
              if (newposition.y > 0 && i === 0) {
                ship.spaceAroundShip.push({
                  x: newposition.x - 1,
                  y: newposition.y - 1,
                  state: true,
                });
                ship.spaceAroundShip.push({ x: newposition.x, y: newposition.y - 1, state: true });
                ship.spaceAroundShip.push({
                  x: newposition.x + 1,
                  y: newposition.y - 1,
                  state: true,
                });
              }

              if (newposition.y < 9 && i === length - 1) {
                ship.spaceAroundShip.push({
                  x: newposition.x - 1,
                  y: newposition.y + 1,
                  state: true,
                });
                ship.spaceAroundShip.push({ x: newposition.x, y: newposition.y + 1, state: true });
                ship.spaceAroundShip.push({
                  x: newposition.x + 1,
                  y: newposition.y + 1,
                  state: true,
                });
              }

              ship.spaceAroundShip.push({ x: newposition.x - 1, y: newposition.y, state: true });
              ship.spaceAroundShip.push({ x: newposition.x + 1, y: newposition.y, state: true });
            }

            if (newposition.x === 0) {
              if (newposition.y > 0 && i === 0) {
                ship.spaceAroundShip.push({ x: newposition.x, y: newposition.y - 1, state: true });
                ship.spaceAroundShip.push({
                  x: newposition.x + 1,
                  y: newposition.y - 1,
                  state: true,
                });
              }

              if (newposition.y < 9 && i === length - 1) {
                ship.spaceAroundShip.push({ x: newposition.x, y: newposition.y + 1, state: true });
                ship.spaceAroundShip.push({
                  x: newposition.x + 1,
                  y: newposition.y + 1,
                  state: true,
                });
              }

              ship.spaceAroundShip.push({ x: newposition.x + 1, y: newposition.y, state: true });
            }

            if (newposition.x === 9) {
              if (newposition.y > 0 && i === 0) {
                ship.spaceAroundShip.push({
                  x: newposition.x - 1,
                  y: newposition.y - 1,
                  state: true,
                });
                ship.spaceAroundShip.push({ x: newposition.x, y: newposition.y - 1, state: true });
              }

              if (newposition.y < 9 && i === length - 1) {
                ship.spaceAroundShip.push({
                  x: newposition.x - 1,
                  y: newposition.y + 1,
                  state: true,
                });
                ship.spaceAroundShip.push({ x: newposition.x, y: newposition.y + 1, state: true });
              }

              ship.spaceAroundShip.push({ x: newposition.x - 1, y: newposition.y, state: true });
              ship.spaceAroundShip.push({ x: newposition.x + 1, y: newposition.y, state: true });
            }
          } else {
            if (newposition.y > 0 && newposition.y < 9) {
              if (newposition.x > 0 && i === 0) {
                ship.spaceAroundShip.push({
                  x: newposition.x - 1,
                  y: newposition.y + 1,
                  state: true,
                });
                ship.spaceAroundShip.push({ x: newposition.x - 1, y: position.y, state: true });
                ship.spaceAroundShip.push({
                  x: newposition.x - 1,
                  y: newposition.y - 1,
                  state: true,
                });
              }

              if (newposition.x < 9 && i === length - 1) {
                ship.spaceAroundShip.push({
                  x: newposition.x + 1,
                  y: newposition.y + 1,
                  state: true,
                });
                ship.spaceAroundShip.push({ x: newposition.x + 1, y: newposition.y, state: true });
                ship.spaceAroundShip.push({
                  x: newposition.x + 1,
                  y: newposition.y - 1,
                  state: true,
                });
              }

              ship.spaceAroundShip.push({ x: newposition.x, y: newposition.y - 1, state: true });
              ship.spaceAroundShip.push({ x: newposition.x, y: newposition.y + 1, state: true });
            }

            if (newposition.y === 0) {
              if (position.x > 0 && i === 0) {
                ship.spaceAroundShip.push({ x: newposition.x - 1, y: newposition.y, state: true });
                ship.spaceAroundShip.push({
                  x: newposition.x - 1,
                  y: newposition.y + 1,
                  state: true,
                });
              }

              if (newposition.x < 9 && i === length - 1) {
                ship.spaceAroundShip.push({ x: newposition.x + 1, y: newposition.y, state: true });
                ship.spaceAroundShip.push({
                  x: newposition.x + 1,
                  y: newposition.y + 1,
                  state: true,
                });
              }

              ship.spaceAroundShip.push({ x: newposition.x, y: newposition.y + 1, state: true });
            }

            if (newposition.y === 9) {
              if (newposition.x > 0 && i === 0) {
                ship.spaceAroundShip.push({ x: newposition.x - 1, y: newposition.y, state: true });
                ship.spaceAroundShip.push({
                  x: newposition.x - 1,
                  y: newposition.y - 1,
                  state: true,
                });
              }

              if (newposition.x < 9 && i === length - 1) {
                ship.spaceAroundShip.push({ x: newposition.x + 1, y: newposition.y, state: true });
                ship.spaceAroundShip.push({
                  x: newposition.x + 1,
                  y: newposition.y - 1,
                  state: true,
                });
              }

              ship.spaceAroundShip.push({ x: newposition.x, y: newposition.y - 1, state: true });
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

      return wsId;
    } catch {
      return false;
    }
  }
  createPlayerShotDb(gameId: number, indexPlayer: number): void {
    const shotMatrix: shot[][] = Array.from({ length: 10 }, () => Array(10).fill(0));
    if (this.shotDb.get(gameId)) {
      this.shotDb.get(gameId)[indexPlayer] = shotMatrix;
    } else {
      this.shotDb.set(gameId, { [indexPlayer]: shotMatrix });
    }
  }

  isShotExist(gameId: number, indexPlayer: number, { x, y }: IPosition): boolean {
    const shotMatrix: shot[][] = this.shotDb.get(gameId)[indexPlayer];

    return shotMatrix[y][x] === 1;
  }

  saveShot(gameId: number, indexPlayer: number, { x, y }: IPosition): void {
    const shotMatrix: shot[][] = this.shotDb.get(gameId)[indexPlayer];
    shotMatrix[y][x] = 1;
  }

  attack(data: IAttackRequest): IAttackResponse[] {
    try {
      if (data.indexPlayer === this.currentPlayer.get(data.gameId)) {
        if (!this.isShotExist(data.gameId, data.indexPlayer, { x: data.x, y: data.y })) {
          this.saveShot(data.gameId, data.indexPlayer, { x: data.x, y: data.y });
          const currentGameInfo = this.gameDb.get(data.gameId);

          const indexPlayersArr: number[] = [];
          for (const player of currentGameInfo) {
            indexPlayersArr.push(Number(Object.keys(player)[0]));
          }
          let currentStatus: statusCeil = 'miss';
          const anotherIndexPlayer: number = indexPlayersArr.filter(
            (index: number) => index !== data.indexPlayer
          )[0];

          const anotherPlayerIndexOfPlayersArr: number =
            indexPlayersArr.indexOf(anotherIndexPlayer);

          const shipsofAnotherPlayer: IShipDb[] =
            currentGameInfo[anotherPlayerIndexOfPlayersArr][String(anotherIndexPlayer)];

          for (const ship of shipsofAnotherPlayer) {
            for (const position of ship.position) {
              if (position.x === data.x && position.y === data.y) {
                position.state = false;
                currentStatus = 'shot';

                const allStatesAreFalse = ship.position.every(
                  (position) => position.state === false
                );

                if (allStatesAreFalse) {
                  const allresponses: IAttackResponse[] = [];
                  for (const position2 of ship.position) {
                    const response: IAttackResponse = {
                      position: {
                        x: position2.x,
                        y: position2.y,
                      },
                      currentPlayer: data.indexPlayer,
                      status: 'killed',
                    };
                    allresponses.push(response);
                  }
                  for (const spaceAroundShip of ship.spaceAroundShip) {
                    const response: IAttackResponse = {
                      position: {
                        x: spaceAroundShip.x,
                        y: spaceAroundShip.y,
                      },
                      currentPlayer: data.indexPlayer,
                      status: 'miss',
                    };
                    allresponses.push(response);
                    this.saveShot(data.gameId, data.indexPlayer, {
                      x: spaceAroundShip.x,
                      y: spaceAroundShip.y,
                    });
                  }

                  return allresponses;
                }
                return [
                  {
                    position: {
                      x: data.x,
                      y: data.y,
                    },
                    currentPlayer: data.indexPlayer,
                    status: currentStatus,
                  },
                ];
              }
            }
          }
          this.currentPlayer.set(data.gameId, anotherIndexPlayer);
          return [
            {
              position: {
                x: data.x,
                y: data.y,
              },
              currentPlayer: data.indexPlayer,
              status: currentStatus,
            },
          ];
        } else {
          console.log('shot already exist');
        }
      } else {
        console.log("**********It's not your turn********");
      }
    } catch (err) {
      console.log('Something went wrong in attack');
    }
  }

  randomAttack(data: IRandomAttackRequest): IAttackResponse[] {
    let count = 100;
    const { x, y } = this.getRandomPosition();

    const shotMatrix: shot[][] = this.shotDb.get(data.gameId)[data.indexPlayer];

    if (!shotMatrix[y][x]) {
      const requestAttack: IAttackRequest = {
        gameId: data.gameId,
        x,
        y,
        indexPlayer: data.indexPlayer,
      };
      return this.attack(requestAttack);
    } else {
      if (count > 0) {
        count -= 1;
        return this.randomAttack(data);
      }
    }
  }

  isGameFinish(gameId: number, indexAnotherPlayer: number): boolean {
    const shipsofAnotherPlayer = this.gameDb
      .get(gameId)
      .filter((player) => player.hasOwnProperty(indexAnotherPlayer))[0][indexAnotherPlayer];
    return shipsofAnotherPlayer.every((ship) =>
      ship.position.every(({ state }) => state === false)
    );
  }
  getRandomPosition(): IPosition {
    const max = 10;
    const randomX = Math.floor(Math.random() * max);
    const randomY = Math.floor(Math.random() * max);
    return { x: randomX, y: randomY };
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
  getIndexesPlayersByGameId(gameId: number): indexPlayer[] {
    const gameData = this.gameDb.get(gameId);
    return gameData.map((el) => {
      const playerName = Object.keys(el)[0];
      return parseInt(playerName);
    });
  }
}

export const seaButtle = new SeaBattleGame();
