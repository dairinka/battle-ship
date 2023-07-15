import {
  IUserRequest2,
  IServerResponse2,
  IUserInfo,
  IRegRequest,
  IAddPlayerToRoomRequest,
  IAddShipRequest,
  IAttackRequest,
  IRandomAttackRequest,
  IAttackResponse,
} from '../types/types';
import { currentUserDb } from '../database/UsersDb';
import { currentGameRooms } from '../database/GameRooms';
import { seaButtle } from '../database/ShipsDb';

type IReqData =
  | IRegRequest
  | string
  | IAddPlayerToRoomRequest
  | IAddShipRequest
  | IAttackRequest
  | IRandomAttackRequest;

let userInfo: IUserInfo = { name: '', index: 0 };

export const parseUserData = (
  data: IUserRequest2,
  wsId: number
): IServerResponse2 | IServerResponse2[] => {
  let infoAboutUser: IUserInfo = { name: '', index: 0 };
  const reqData: IReqData = data.data ? JSON.parse(data.data) : '';
  switch (data.type) {
    case 'reg':
      const dbResponse = currentUserDb.addUsers(reqData as IRegRequest, wsId);

      userInfo.name = dbResponse.name;
      userInfo.index = dbResponse.index;
      return {
        type: data.type,
        data: JSON.stringify(dbResponse),
        id: 0,
      };
    case 'create_room':
      infoAboutUser = currentUserDb.getUserInfoByWsId(wsId);
      const GRResponseCreateRoom = currentGameRooms.createRoom(infoAboutUser, wsId);
      return {
        type: 'update_room',
        data: JSON.stringify(GRResponseCreateRoom),
        id: 0,
      };
    case 'add_user_to_room':
      infoAboutUser = currentUserDb.getUserInfoByWsId(wsId);
      const GRResponseAddUser = currentGameRooms.addUserToRoom(
        reqData as IAddPlayerToRoomRequest,
        wsId,
        infoAboutUser
      );
      return {
        type: 'create_game',
        data: JSON.stringify(GRResponseAddUser),
        id: 0,
      };
    case 'attack': {
      const response = seaButtle.attack(reqData as IAttackRequest);
      if (Array.isArray(response)) {
        const serverResponse: IServerResponse2[] = [];
        for (const res of response) {
          const result: IServerResponse2 = {
            type: 'attack',
            data: JSON.stringify(res),
            id: 0,
          };
          serverResponse.push(result);
        }
        return serverResponse;
      }
      return {
        type: 'attack',
        data: JSON.stringify(response),
        id: 0,
      };
    }
    case 'randomAttack': {
      const randomAttackResponse: IAttackResponse[] = seaButtle.randomAttack(
        reqData as IRandomAttackRequest
      );
      const serverrandomAttackResponse: IServerResponse2[] = [];
      for (const res of randomAttackResponse) {
        const result: IServerResponse2 = {
          type: 'attack',
          data: JSON.stringify(res),
          id: 0,
        };
        serverrandomAttackResponse.push(result);
      }
      return serverrandomAttackResponse;
    }
  }
};
