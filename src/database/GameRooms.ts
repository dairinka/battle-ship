import { IUserInfo } from '../types/types';

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

  createRoom(userInfo: IUserInfo, wsId: number) {
    const roomNumber = this.roomInfo.size;
    this.roomInfo.set(`room_${roomNumber}`, {
      user_1: [userInfo.name, userInfo.index, wsId],
    });

    const updateRoom = Array.from(this.roomInfo.entries())
      .filter(([_, room]) => room.user_2 === undefined)
      .map(([roomName, room]) => {
        const roomId = roomName.split('_')[1];
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
    return updateRoom;
  }

  addUserToRoom(userInfo: IUserInfo, wsId: number) {
    const currentRoom = this.listRooms[1].split('_')[1];
    console.log('currentRoom', currentRoom);
    this.roomInfo[currentRoom].push(userInfo);
    this.listRooms.pop();
    return {
      idGame: this.idGame[currentRoom],
      idPlayer: userInfo.index,
    };
  }
}

export const currentGameRooms = new GameRooms();
