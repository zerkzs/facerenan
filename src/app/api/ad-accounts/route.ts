import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/features/auth/infrastructure/next-auth-config";
import { SupabaseBmRepository } from "@/features/business-manager/infrastructure/supabase-bm-repository";
import { MetaAdAccountsApiClient } from "@/features/ad-accounts/infrastructure/meta-ad-accounts-client";
import { SupabaseAccountIndexRepository } from "@/features/ad-accounts/infrastructure/supabase-account-index-repository";
import { ListAdAccounts } from "@/features/ad-accounts/application/list-ad-accounts";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bmId = request.nextUrl.searchParams.get("bm_id");
  if (!bmId) {
    return NextResponse.json(
      { error: "bm_id query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const bmRepo = new SupabaseBmRepository();
    const metaApi = new MetaAdAccountsApiClient();
    const indexRepo = new SupabaseAccountIndexRepository();
    const useCase = new ListAdAccounts(bmRepo, metaApi, indexRepo);

    const accounts = await useCase.execute(session.user.id, bmId);
    return NextResponse.json(accounts);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
