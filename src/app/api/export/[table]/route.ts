import { createServiceClient } from "@/lib/supabase/server";

const ALLOWED_TABLES = ["employees", "candidates_pipeline", "temp_logs", "agent_events", "corrective_actions", "certifications", "job_postings", "leads"];

export async function GET(_request: Request, { params }: { params: Promise<{ table: string }> }) {
  const { table } = await params;

  if (!ALLOWED_TABLES.includes(table)) {
    return new Response(`Table "${table}" not allowed for export. Allowed: ${ALLOWED_TABLES.join(", ")}`, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false }).limit(5000);

  if (error) return new Response(`Error: ${error.message}`, { status: 500 });
  if (!data || data.length === 0) return new Response("No data to export", { status: 404 });

  // Convert to CSV
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map(row =>
      headers.map(h => {
        const val = (row as Record<string, unknown>)[h];
        if (val === null || val === undefined) return "";
        const str = typeof val === "object" ? JSON.stringify(val) : String(val);
        // Escape quotes and wrap if contains comma/newline/quote
        if (str.includes(",") || str.includes("\n") || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(",")
    ),
  ];

  const csv = csvRows.join("\n");
  const filename = `${table}_export_${new Date().toISOString().split("T")[0]}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
