import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { IUserRepository } from '../repositories/IUserRepository';
import type { RegisterDto, LoginDto, AuthResponse, JwtPayload } from '../types/auth';

const BCRYPT_ROUNDS = 12;
const JWT_EXPIRES_IN = '7d';

function getJwtSecret(): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return secret;
}

export class AuthService {
  constructor(private userRepository: IUserRepository) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new Error('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.userRepository.create(dto.username, dto.email, passwordHash);

    const payload: JwtPayload = { userId: user.id, username: user.username, email: user.email };
    const token = jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });

    return { token, user };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const userWithPassword = await this.userRepository.findByEmail(dto.email);
    if (!userWithPassword) {
      throw new Error('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, userWithPassword.password_hash);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    const { id, username, email } = userWithPassword;
    const payload: JwtPayload = { userId: id, username, email };
    const token = jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });

    return { token, user: { id, username, email } };
  }
}
