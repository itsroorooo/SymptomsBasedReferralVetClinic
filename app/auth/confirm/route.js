// route.js
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (!token_hash || !type) {
    return redirect("/error");
  }

  const supabase = await createSupabaseServerClient(); // ✅ awaited call
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    return redirect("/error");
  }

  await supabase.auth.getSession();
  return redirect(next);
}

export async function POST(request) {
  const supabase = await createSupabaseServerClient(); // ✅ awaited call

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { petType, symptoms, additionalInfo } = await request.json();

    const result = await generatePetDiagnosis(
      petType,
      symptoms,
      additionalInfo
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}