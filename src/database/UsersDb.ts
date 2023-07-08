import { IRegResponse, IUserInfo } from '../types/types';
import { IRegRequest } from '../types/types';

interface IUserAuth {
  index: number;
  name: string;
  password: string;
  wsId: number;
}

class UsersDb {
  database: Map<string, IUserAuth>;
  userCount: number;

  constructor() {
    this.database = new Map();
    this.userCount = 0;
  }

  addUsers(data: IRegRequest, wsId: number): IRegResponse {
    if (!this.isUserExist(data.name)) {
      if (typeof data.name !== 'string') {
        return {
          name: data.name,
          index: 0,
          error: true,
          errorText: 'Name should be string',
        };
      }
      this.userCount += 1;

      const newUser = {
        index: this.userCount,
        name: data.name,
        password: data.password,
        wsId,
      };
      console.log('newUser', newUser);
      this.database.set(data.name, newUser);

      return {
        name: newUser.name,
        index: newUser.index,
        error: false,
        errorText: '',
      };
    }
    console.log('user exist');
    this.checkUser(data);
  }

  checkUser(data: IRegRequest) {
    const userInfo = this.getUserInfo(data.name);
    if (data.password === userInfo.password) {
      return {
        name: userInfo.name,
        index: userInfo.index,
        error: false,
        errorText: '',
      };
    }
    return {
      name: userInfo.name,
      index: userInfo.index,
      error: true,
      errorText: 'Password was wrong',
    };
  }

  getUserInfo(userName: string): IUserAuth {
    return this.database.get(userName);
  }

  getUserInfoByWsId(wsId: number): IUserInfo {
    let userInfo: IUserInfo = { name: '', index: 0 };
    this.database.forEach((user) => {
      if (user.wsId === wsId) {
        userInfo.name = user.name;
        userInfo.index = user.index;
      }
    });
    return userInfo;
  }

  isUserExist(userName: string) {
    console.log(this.database.has(userName));
    return this.database.has(userName);
  }
}

export const currentUserDb = new UsersDb();
