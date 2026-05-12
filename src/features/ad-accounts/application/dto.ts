import { z } from "zod";

export const ListAdAccountsSchema = z.object({
  bmId: z.string().min(1, "Business Manager internal ID is required"),
});

export const SearchAdAccountsSchema = z.object({
  q: z.string().min(1, "Search query is required"),
});

export type ListAdAccountsDto = z.infer<typeof ListAdAccountsSchema>;
export type SearchAdAccountsDto = z.infer<typeof SearchAdAccountsSchema>;
