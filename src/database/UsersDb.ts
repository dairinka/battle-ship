import { IRegResponse, IUserInfo, IUpdateWinner } from '../types/types';
import { IRegRequest } from '../types/types';
type userName = string;
type indexPlayer = number;
type winCount = number;
interface IUserAuth {
  index: number;
  name: string;
  password: string;
  wsId: number;
}

class UsersDb {
  database: Map<userName, IUserAuth>;
  userCount: number;
  users: Map<indexPlayer, userName>;
  winners: Map<userName, winCount>;

  constructor() {
    this.database = new Map();
    this.userCount = 0;
    this.users = new Map();
    this.winners = new Map();
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

      this.database.set(data.name, newUser);
      this.users.set(this.userCount, data.name);
      this.winners.set(data.name, 0);
      return {
        name: newUser.name,
        index: newUser.index,
        error: false,
        errorText: '',
      };
    }

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

  getUserInfo(userName: userName): IUserAuth {
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

  isUserExist(userName: userName) {
    return this.database.has(userName);
  }

  getUserNameByIndexPlayer(indexPlayer: number): userName {
    return this.users.get(indexPlayer);
  }

  addWinToUserByName(userName: userName): void {
    const currentCount = this.winners.get(userName) + 1;
    this.winners.set(userName, currentCount);
  }
  getAllWinners(): IUpdateWinner[] {
    const names = [...this.winners.keys()];

    return names.map((name) => {
      return {
        name: name,
        wins: `${this.winners.get(name)}`,
      };
    });
  }
}

export const currentUserDb = new UsersDb();
