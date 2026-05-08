import type { BusinessManager } from "../domain/entities";
import type { BusinessManagerRepository } from "../domain/repository";

export class ListBusinessManagers {
  constructor(private readonly repo: BusinessManagerRepository) {}

  async execute(userId: string): Promise<BusinessManager[]> {
    return this.repo.findByUserId(userId);
  }
}
