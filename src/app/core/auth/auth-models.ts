import {User} from '../../shared/models/user.model';

export interface UserToLog {
  username: string;
  password: string;
}

export type AuthStatus = 'AUTHENTICATED' | 'MFA_REQUIRED' | 'MFA_SETUP_REQUIRED';

/** One step of the login: either a session, or a challenge to finish with the second factor. */
export interface AuthLoginResponse {
  status: AuthStatus;
  token?: string;
  refreshToken?: string;
  challengeToken?: string;
  passwordChangeRequired: boolean;
  recoveryCodes?: string[];
  user?: User;
}

export interface MfaSetup {
  secret: string;
  otpauthUri: string;
}
