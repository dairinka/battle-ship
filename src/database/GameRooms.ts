import { IUserInfo, IAddPlayerToRoomRequest, IUpdateRoomStateResponse } from '../types/types';

interface IUserInfoInRoom {
  user_1: [userName: string, userId: number, wsId: number];
  user_2?: [userName: string, userId: number, wsId: number];
}
type roomNumber = number;
type idGame = number;
class GameRooms {
  listRooms: number[];
  roomInfo: Map<roomNumber, IUserInfoInRoom>;
  idGame: { [key: roomNumber]: idGame };
  countRoom: number;

  constructor() {
    this.listRooms = [100, 101, 102, 103, 104, 105, 106, 107, 108];
    this.roomInfo = new Map();
    this.idGame = {
      100: 12,
      101: 13,
      102: 14,
      103: 15,
      104: 16,
      105: 17,
      106: 18,
      107: 19,
      108: 20,
    };
    this.countRoom = 0;
  }

  createRoom(userInfo: IUserInfo, wsId: number): IUpdateRoomStateResponse[] {
    for (let i = 0; i < this.listRooms.length; i++) {
      if (!this.roomInfo.get(this.listRooms[i])) {
        this.roomInfo.set(this.listRooms[i], {
          user_1: [userInfo.name, userInfo.index, wsId],
        });
        break;
      }
    }

    const updateRoom = this.updateRoom();
    return updateRoom;
  }

  addUserToRoom({ indexRoom }: IAddPlayerToRoomRequest, wsId: number, userInfo: IUserInfo) {
    const roomInfo = this.roomInfo.get(indexRoom);

    if (roomInfo && roomInfo.user_1[0] !== userInfo.name && roomInfo.user_2 === undefined) {
      roomInfo.user_2 = [userInfo.name, userInfo.index, wsId];

      Array.from(this.roomInfo.entries()).forEach(([key, otherRoom]) => {
        if (
          key !== indexRoom &&
          (otherRoom.user_1[0] === userInfo.name ||
            (otherRoom.user_2 && otherRoom.user_2[0] === userInfo.name))
        ) {
          if (otherRoom.user_2) {
            otherRoom.user_2 = undefined;
          } else {
            this.roomInfo.delete(key);
          }
        }
      });
      this.listRooms = this.listRooms.slice(1);

      return {
        idGame: this.idGame[indexRoom],
        idPlayer: userInfo.index,
      };
    }
  }

  updateRoom(): IUpdateRoomStateResponse[] {
    return Array.from(this.roomInfo.entries())
      .filter(([_, room]) => room.user_2 === undefined)
      .map(([roomId, room]) => {
        return {
          roomId,
          roomUsers: [
            {
              name: room.user_1[0],
              index: room.user_1[1],
            },
          ],
        };
      });
  }

  getWsIdsinOneRoomByRoomIndex(roomIndex: number): number[] {
    const currentRoom = this.roomInfo.get(roomIndex);

    return [currentRoom.user_1[2], currentRoom.user_2[2]];
  }

  getUserIdsinOneRoomByRoomIndex(roomIndex: number): number[] {
    const currentRoom = this.roomInfo.get(roomIndex);

    return [currentRoom.user_1[1], currentRoom.user_2[1]];
  }

  getRoomNumberByIdGame(idGame: number): roomNumber {
    for (const key in this.idGame) {
      if (this.idGame[key] === idGame) {
        return parseInt(key);
      }
    }
  }
  closeRoom(roomIndex: number): void {
    delete this.idGame[roomIndex];

    this.roomInfo.delete(roomIndex);
  }
}

export const currentGameRooms = new GameRooms();
