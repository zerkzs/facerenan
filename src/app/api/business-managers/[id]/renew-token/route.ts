import { NextResponse } from "next/server";
import { auth } from "@/features/auth/infrastructure/next-auth-config";
import { SupabaseBmRepository } from "@/features/business-manager/infrastructure/supabase-bm-repository";
import { MetaGraphApiClient } from "@/features/business-manager/infrastructure/meta-api-client";
import { RenewToken } from "@/features/business-manager/application/renew-token";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const repo = new SupabaseBmRepository();
    const metaApi = new MetaGraphApiClient();
    const useCase = new RenewToken(repo, metaApi);
    const bm = await useCase.execute(id, session.user.id);
    return NextResponse.json(bm);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
