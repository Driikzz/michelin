import type { User } from '../types/user';
import type { IUserRepository } from '../repositories/IUserRepository';

export class UserService {
  constructor(private userRepository: IUserRepository) {}

  getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  getUserById(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}
