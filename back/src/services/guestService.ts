import type { IGuestRepository } from '../repositories/IGuestRepository';

export class GuestService {
  constructor(private guestRepository: IGuestRepository) {}

  async createGuest(nickname: string): Promise<{ id: string; nickname: string }> {
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 30) {
      throw new Error('Nickname must be between 2 and 30 characters');
    }
    if (!/^[\p{L}\p{N} '_-]+$/u.test(trimmed)) {
      throw new Error("Nickname can only contain letters, numbers, spaces, apostrophes, underscores, and hyphens");
    }
    const guest = await this.guestRepository.create(trimmed);
    return { id: guest.id, nickname: guest.nickname };
  }
}
