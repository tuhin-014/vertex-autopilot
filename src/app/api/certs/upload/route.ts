import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const certId = formData.get("cert_id") as string;
  const employeeId = formData.get("employee_id") as string;

  if (!file || !certId) {
    return NextResponse.json({ error: "file and cert_id required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Upload to Supabase Storage
  const fileName = `certs/${employeeId || "unknown"}/${certId}_${Date.now()}_${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("documents")
    .upload(fileName, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    // If bucket doesn't exist, create it
    if (uploadError.message.includes("not found")) {
      await supabase.storage.createBucket("documents", { public: false });
      const { error: retryError } = await supabase.storage
        .from("documents")
        .upload(fileName, buffer, { contentType: file.type });
      if (retryError) return NextResponse.json({ error: retryError.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from("documents").getPublicUrl(fileName);

  // Update certification record
  await supabase.from("certifications").update({ document_url: urlData.publicUrl }).eq("id", certId);

  return NextResponse.json({ success: true, url: urlData.publicUrl, path: uploadData?.path || fileName });
}
