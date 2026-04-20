export interface User {
  id: number;
  username: string;
  email: string;
}

export interface UserWithPassword extends User {
  password_hash: string;
  created_at: Date;
}
