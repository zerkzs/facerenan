import { NextResponse } from "next/server";
import { auth } from "@/features/auth/infrastructure/next-auth-config";
import { SupabaseBmRepository } from "@/features/business-manager/infrastructure/supabase-bm-repository";
import { MetaGraphApiClient } from "@/features/business-manager/infrastructure/meta-api-client";
import { ListBusinessManagers } from "@/features/business-manager/application/list-business-managers";
import { CreateBusinessManager } from "@/features/business-manager/application/create-business-manager";
import { CreateBusinessManagerSchema } from "@/features/business-manager/application/dto";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const repo = new SupabaseBmRepository();
    const useCase = new ListBusinessManagers(repo);
    const bms = await useCase.execute(session.user.id);
    return NextResponse.json(bms);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = CreateBusinessManagerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const repo = new SupabaseBmRepository();
    const metaApi = new MetaGraphApiClient();
    const useCase = new CreateBusinessManager(repo, metaApi);
    const bm = await useCase.execute(session.user.id, parsed.data);
    return NextResponse.json(bm, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
