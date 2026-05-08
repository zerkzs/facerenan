import type { BusinessManagerRepository } from "../domain/repository";

export class DeleteBusinessManager {
  constructor(private readonly repo: BusinessManagerRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) {
      throw new Error("Business Manager not found");
    }

    await this.repo.delete(id, userId);
  }
}
