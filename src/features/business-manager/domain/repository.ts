import type { BusinessManager } from "./entities";

export interface BusinessManagerRepository {
  findByUserId(userId: string): Promise<BusinessManager[]>;
  findById(id: string, userId: string): Promise<BusinessManager | null>;
  findByBmId(bmId: string, userId: string): Promise<BusinessManager | null>;
  create(
    bm: Omit<BusinessManager, "id" | "createdAt" | "updatedAt">
  ): Promise<BusinessManager>;
  update(
    id: string,
    userId: string,
    data: Partial<BusinessManager>
  ): Promise<BusinessManager>;
  delete(id: string, userId: string): Promise<void>;
}
