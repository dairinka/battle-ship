import {
  IUserInfo,
  IAddPlayerToRoomRequest,
  IUpdateRoomStateResponse,
  IAddShipRequest,
} from '../types/types';

interface IUserInfoInRoom {
  user_1: [userName: string, userId: number, wsId: number];
  user_2?: [userName: string, userId: number, wsId: number];
}

class GameRooms {
  listRooms: string[];
  roomInfo: Map<string, IUserInfoInRoom>;
  idGame: number[];

  constructor() {
    this.listRooms = ['room_1', 'room_2', 'room_3', 'room_4'];
    this.roomInfo = new Map();
    this.idGame = [12, 13, 14, 15, 16];
  }

  createRoom(userInfo: IUserInfo, wsId: number): IUpdateRoomStateResponse[] {
    const roomNumber = this.roomInfo.size;
    this.roomInfo.set(`room_${roomNumber}`, {
      user_1: [userInfo.name, userInfo.index, wsId],
    });

    const updateRoom = this.updateRoom();
    return updateRoom;
  }

  addUserToRoom({ indexRoom }: IAddPlayerToRoomRequest, wsId: number, userInfo: IUserInfo) {
    const roomName = `room_${indexRoom}`;
    const room = this.roomInfo.get(roomName);
    if (room && room.user_1[0] !== userInfo.name) {
      room.user_2 = [userInfo.name, userInfo.index, wsId];

      Array.from(this.roomInfo.entries()).forEach(([key, otherRoom]) => {
        if (
          key !== roomName &&
          (otherRoom.user_1[0] === userInfo.name ||
            (otherRoom.user_2 && otherRoom.user_2[0] === userInfo.name))
        ) {
          if (otherRoom.user_2) {
            otherRoom.user_2 = undefined;
          } else {
            this.roomInfo.delete(key);
            this.listRooms = this.listRooms.filter((el) => el !== key);
          }
        }
      });
      return {
        idGame: this.idGame[indexRoom],
        idPlayer: userInfo.index,
      };
    }
  }

  updateRoom(): IUpdateRoomStateResponse[] {
    return Array.from(this.roomInfo.entries())
      .filter(([_, room]) => room.user_2 === undefined)
      .map(([roomName, room]) => {
        const roomId = Number(roomName.split('_')[1]);
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
    const roomName = `room_${roomIndex}`;

    const currentRoom = this.roomInfo.get(roomName);

    return [currentRoom.user_1[2], currentRoom.user_2[2]];
  }
  getUserIdsinOneRoomByRoomIndex(roomIndex: number): number[] {
    const roomName = `room_${roomIndex}`;

    const currentRoom = this.roomInfo.get(roomName);

    return [currentRoom.user_1[1], currentRoom.user_2[1]];
  }

  addShips(userData: IAddShipRequest) {}
}

export const currentGameRooms = new GameRooms();
