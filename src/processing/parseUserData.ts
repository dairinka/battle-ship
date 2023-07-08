import { IUserRequest2, IServerResponse2, IUserInfo } from '../types/types';
import { currentUserDb } from '../database/UsersDb';
import { currentGameRooms } from '../database/GameRooms';

let userInfo: IUserInfo = { name: '', index: 0 };

export const parseUserData = (data: IUserRequest2, wsId: number): IServerResponse2 => {
  console.log('data.data', data.data);
  const regData = data.data ? JSON.parse(data.data) : '';
  switch (data.type) {
    case 'reg':
      const dbResponse = currentUserDb.addUsers(regData, wsId);
      console.log('dbResponse', dbResponse);
      userInfo.name = dbResponse.name;
      userInfo.index = dbResponse.index;
      return {
        type: data.type,
        data: JSON.stringify(dbResponse),
        id: 0,
      };
    case 'create_room':
      const infoAboutUser = currentUserDb.getUserInfoByWsId(wsId);
      const GRResponseCreateRoom = currentGameRooms.createRoom(infoAboutUser, wsId);
      return {
        type: 'update_room',
        data: JSON.stringify(GRResponseCreateRoom),
        id: 0,
      };
    case 'add_user_to_room':
      const GRResponseAddUser = currentGameRooms.addUserToRoom(regData, wsId);
      return {
        type: 'create_game',
        data: JSON.stringify([GRResponseAddUser]),
        id: 0,
      };
  }
};
