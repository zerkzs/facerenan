import { NextResponse } from "next/server";
import { auth } from "@/features/auth/infrastructure/next-auth-config";
import { SupabaseBmRepository } from "@/features/business-manager/infrastructure/supabase-bm-repository";
import { MetaGraphApiClient } from "@/features/business-manager/infrastructure/meta-api-client";
import { InviteBusinessUser } from "@/features/business-manager/application/invite-business-user";
import { InviteBusinessUserSchema } from "@/features/business-manager/application/dto";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const body = await request.json();
  const parsed = InviteBusinessUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const repo = new SupabaseBmRepository();
    const metaApi = new MetaGraphApiClient();
    const useCase = new InviteBusinessUser(repo, metaApi);
    const result = await useCase.execute(
      id,
      session.user.id,
      parsed.data.email,
      parsed.data.role
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
