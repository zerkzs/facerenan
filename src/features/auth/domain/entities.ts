export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  metaId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
