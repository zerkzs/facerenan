import { NextResponse } from "next/server";
import { auth } from "@/features/auth/infrastructure/next-auth-config";
import { SupabaseBmRepository } from "@/features/business-manager/infrastructure/supabase-bm-repository";
import { MetaGraphApiClient } from "@/features/business-manager/infrastructure/meta-api-client";
import { UpdateBusinessManager } from "@/features/business-manager/application/update-business-manager";
import { DeleteBusinessManager } from "@/features/business-manager/application/delete-business-manager";
import { UpdateBusinessManagerSchema } from "@/features/business-manager/application/dto";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const body = await request.json();
  const parsed = UpdateBusinessManagerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const repo = new SupabaseBmRepository();
    const metaApi = new MetaGraphApiClient();
    const useCase = new UpdateBusinessManager(repo, metaApi);
    const bm = await useCase.execute(id, session.user.id, parsed.data);
    return NextResponse.json(bm);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const repo = new SupabaseBmRepository();
    const useCase = new DeleteBusinessManager(repo);
    await useCase.execute(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
