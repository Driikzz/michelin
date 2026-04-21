export interface IGuestRepository {
  create(nickname: string): Promise<{ id: string; nickname: string; created_at: Date }>;
  findById(id: string): Promise<{ id: string; nickname: string } | null>;
}
