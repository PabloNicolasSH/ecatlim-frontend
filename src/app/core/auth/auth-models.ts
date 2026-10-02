import {User} from '../../shared/models/user.model';

export interface UserToLog {
  username: string;
  password: string;
}

export interface AuthLoginResponse {
  token: string;
  user: User;
}
