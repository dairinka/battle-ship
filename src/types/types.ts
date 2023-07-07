type TypeRequest =
  | 'reg'
  | 'create_room'
  | 'add_player_to_room'
  | 'add_ships'
  | 'attack'
  | 'randomAttack';
type TypeResponse =
  | 'reg'
  | 'update_winners'
  | 'create_game'
  | 'update_room'
  | 'attack'
  | 'turn'
  | 'finish';
const enum Id {
  zero = 0,
}

export interface IUserRequest {
  type: TypeRequest;
  data: IRegRequest | string | IAddPlayerToRoomRequest | IAddShipRequest | IAttackRequest;
  id: Id.zero;
}

export interface IServerResponse {
  type: TypeRequest;
  data:
    | IRegResponse
    | IUpdateWinner[]
    | ICreateGameResponse
    | IUpdateRoomStateResponse[]
    | IAtackResponse
    | IPlayerTurnResponse
    | IFinishGameResponse;
  id: Id.zero;
}

interface IRegRequest {
  name: string;
  password: string;
}

// interface ICreateRoomRequest {
//   data: string;
// }

interface IAddPlayerToRoomRequest {
  indexRoom: number;
}

interface IAddShipRequest {
  gameId: number;
  ships: [
    {
      position: {
        x: number;
        y: number;
      };
      direction: boolean;
      length: number;
      type: 'small' | 'medium' | 'large' | 'huge';
    },
  ];
  indexPlayer: number;
}

interface IAttackRequest {
  gameID: number;
  x: number;
  y: number;
  indexPlayer: number;
}

interface IRandomAttackRequest {
  gameID: number;
  indexPlayer: number;
}

interface IRegResponse {
  name: string;
  index: number;
  error: boolean;
  errorText: string;
}

interface IUpdateWinner {
  name: string;
  wins: string;
}

interface ICreateGameResponse {
  idGame: string;
  idPlayer: string;
}

interface IUpdateRoomStateResponse {
  roomId: number;
  roomUsers: {
    name: string;
    index: number;
  };
}

interface IAtackResponse {
  position: {
    x: number;
    y: number;
  };
  currentPlayer: number;
  status: 'miss' | 'killed' | 'shot';
}

interface IPlayerTurnResponse {
  currentPlayer: number;
}

interface IFinishGameResponse {
  winPlayer: number;
}
