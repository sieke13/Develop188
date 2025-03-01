import type { Book } from './Book';

export interface User {
  username: string | null;
  email: string | null;
  password: string | null;
  savedBooks: Book[];
}
// Initial form state
export const INITIAL_FORM_STATE: User = {
  username: '',
  email: '',
  password: '',
  savedBooks: []
};