import { NextResponse } from "next/server";
import { auth } from "@/features/auth/infrastructure/next-auth-config";
import { MetaGraphApiClient } from "@/features/business-manager/infrastructure/meta-api-client";
import { FetchBmName } from "@/features/business-manager/application/fetch-bm-name";
import { FetchBmNameSchema } from "@/features/business-manager/application/dto";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = FetchBmNameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const metaApi = new MetaGraphApiClient();
    const useCase = new FetchBmName(metaApi);
    const name = await useCase.execute(parsed.data);
    return NextResponse.json({ name });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
