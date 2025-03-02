import type { Book } from './Book';

export interface User {
  username: string;
  email: string;
  password: string;
  savedBooks: string[];
}

export const INITIAL_FORM_STATE: User = {
  username: '',
  email: '',
  password: '',
  savedBooks: [],
};