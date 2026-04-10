import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to run raw SQL via a temporary function
async function execSQL(sql: string) {
  // First ensure the exec_sql function exists
  const createFn = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
    {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  return createFn;
}

export async function GET() {
  const steps: string[] = [];

  try {
    // Step 0: Create the exec_sql function if it doesn't exist
    // We'll do this by creating a simple migration via the REST API
    // Since we can't run DDL directly, we'll use the Supabase management approach
    // Actually, let's just use the REST API to insert data directly
    // and create tables via the seed script approach

    // First, let's try to create tables by using supabase-js .from() with upsert
    // This won't work for CREATE TABLE. Let's use a different approach.
    // We'll create an RPC function first using the management API.

    // Actually - let's just try to insert into va_organizations and if it fails,
    // we know tables don't exist. In that case, we'll need to create them via
    // the Supabase dashboard SQL editor.

    // Try inserting the organization
    const orgId = "11111111-1111-1111-1111-111111111111";

    // Check if data already exists
    const { data: existingOrg } = await supabase
      .from("va_organizations")
      .select("id")
      .eq("id", orgId)
      .single();

    if (existingOrg) {
      // Clean existing data
      steps.push("Cleaning existing data...");
      await supabase.from("va_candidates").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("va_incidents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("va_training").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("va_temp_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("va_checklists").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("va_locations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("va_organizations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      steps.push("Cleaned existing data");
    }

    // Step 1: Insert organization
    const { error: orgError } = await supabase.from("va_organizations").insert({
      id: orgId,
      name: "IHOP Southeast Region",
      plan: "enterprise",
    });
    if (orgError) throw new Error(`Org insert failed: ${orgError.message}. Tables may not exist - run the schema SQL in Supabase SQL Editor first.`);
    steps.push("Created organization: IHOP Southeast Region");

    // Step 2: Insert 10 locations
    const locationData = [
      { id: "aaaa0001-0001-0001-0001-000000000001", name: "IHOP #1247 - Buckhead", address: "3345 Peachtree Rd NE", city: "Atlanta", state: "GA", manager_name: "Marcus Johnson", manager_email: "marcus.j@ihop-se.com", staff_count: 22 },
      { id: "aaaa0001-0001-0001-0001-000000000002", name: "IHOP #1389 - Midtown", address: "1055 Peachtree St NE", city: "Atlanta", state: "GA", manager_name: "Sarah Chen", manager_email: "sarah.c@ihop-se.com", staff_count: 18 },
      { id: "aaaa0001-0001-0001-0001-000000000003", name: "IHOP #2201 - Brickell", address: "901 S Miami Ave", city: "Miami", state: "FL", manager_name: "Carlos Rivera", manager_email: "carlos.r@ihop-se.com", staff_count: 25 },
      { id: "aaaa0001-0001-0001-0001-000000000004", name: "IHOP #2215 - Coral Gables", address: "2320 Galiano St", city: "Coral Gables", state: "FL", manager_name: "Diana Morales", manager_email: "diana.m@ihop-se.com", staff_count: 20 },
      { id: "aaaa0001-0001-0001-0001-000000000005", name: "IHOP #1876 - Germantown", address: "7640 W Farmington Blvd", city: "Germantown", state: "TN", manager_name: "James Williams", manager_email: "james.w@ihop-se.com", staff_count: 16 },
      { id: "aaaa0001-0001-0001-0001-000000000006", name: "IHOP #1502 - Five Points", address: "215 20th St N", city: "Birmingham", state: "AL", manager_name: "Angela Davis", manager_email: "angela.d@ihop-se.com", staff_count: 19 },
      { id: "aaaa0001-0001-0001-0001-000000000007", name: "IHOP #3301 - Uptown", address: "401 N Tryon St", city: "Charlotte", state: "NC", manager_name: "Kevin Park", manager_email: "kevin.p@ihop-se.com", staff_count: 21 },
      { id: "aaaa0001-0001-0001-0001-000000000008", name: "IHOP #3045 - Downtown", address: "140 Carondelet St", city: "New Orleans", state: "LA", manager_name: "Marie Dupont", manager_email: "marie.d@ihop-se.com", staff_count: 17 },
      { id: "aaaa0001-0001-0001-0001-000000000009", name: "IHOP #2890 - Riverside", address: "1560 Prudential Dr", city: "Jacksonville", state: "FL", manager_name: "Tom Baker", manager_email: "tom.b@ihop-se.com", staff_count: 15 },
      { id: "aaaa0001-0001-0001-0001-000000000010", name: "IHOP #1790 - Cary", address: "1233 NW Maynard Rd", city: "Cary", state: "NC", manager_name: "Lisa Nguyen", manager_email: "lisa.n@ihop-se.com", staff_count: 14 },
    ];

    const { error: locError } = await supabase.from("va_locations").insert(
      locationData.map((l) => ({ ...l, org_id: orgId }))
    );
    if (locError) throw new Error(`Locations insert failed: ${locError.message}`);
    steps.push(`Created ${locationData.length} locations`);

    const locationIds = locationData.map((l) => l.id);
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Step 3: Insert checklists (some completed, some missing)
    const checklistTypes = ["food_safety", "opening", "closing", "cleaning"];
    const checklistRows: Record<string, unknown>[] = [];

    for (const locId of locationIds) {
      // Most locations have completed food_safety and opening today
      // A few are missing checklists (to generate alerts)
      const shouldMiss = locId.endsWith("05") || locId.endsWith("09"); // locations 5 and 9 miss checklists

      if (!shouldMiss) {
        checklistRows.push({
          location_id: locId,
          checklist_type: "food_safety",
          completed_by: locationData.find((l) => l.id === locId)?.manager_name,
          completed_at: new Date(now.getTime() - Math.random() * 8 * 3600000).toISOString(),
          score: 85 + Math.floor(Math.random() * 15),
          items: JSON.stringify([
            { task: "Check walk-in cooler temp", done: true, value: "37F" },
            { task: "Check freezer temp", done: true, value: "-2F" },
            { task: "Check hot hold temp", done: true, value: "142F" },
            { task: "Sanitizer concentration", done: true, value: "200ppm" },
            { task: "Handwashing stations stocked", done: true },
            { task: "Food labels current", done: true },
            { task: "No expired items", done: true },
            { task: "Pest control check", done: true },
          ]),
        });

        checklistRows.push({
          location_id: locId,
          checklist_type: "opening",
          completed_by: locationData.find((l) => l.id === locId)?.manager_name,
          completed_at: new Date(now.getTime() - Math.random() * 10 * 3600000).toISOString(),
          score: 90 + Math.floor(Math.random() * 10),
          items: JSON.stringify([
            { task: "Lights and HVAC on", done: true },
            { task: "POS systems booted", done: true },
            { task: "Coffee brewed", done: true },
            { task: "Dining room set", done: true },
            { task: "Restrooms stocked and clean", done: true },
          ]),
        });
      }

      // Some locations have closing from yesterday
      if (!locId.endsWith("08")) {
        checklistRows.push({
          location_id: locId,
          checklist_type: "closing",
          completed_by: "Shift Lead",
          completed_at: new Date(now.getTime() - 14 * 3600000).toISOString(),
          score: 80 + Math.floor(Math.random() * 20),
          items: JSON.stringify([
            { task: "All equipment off", done: true },
            { task: "Floors mopped", done: true },
            { task: "Trash removed", done: true },
            { task: "Doors locked", done: true },
            { task: "Alarm set", done: true },
          ]),
        });
      }
    }

    const { error: clError } = await supabase.from("va_checklists").insert(checklistRows);
    if (clError) throw new Error(`Checklists insert failed: ${clError.message}`);
    steps.push(`Created ${checklistRows.length} checklists`);

    // Step 4: Insert temperature logs (some out of range)
    const tempRows: Record<string, unknown>[] = [];
    const equipment = ["Walk-in Cooler", "Freezer", "Hot Hold Line", "Prep Cooler"];

    for (const locId of locationIds) {
      for (const equip of equipment) {
        // 3 logs per equipment per location today
        for (let i = 0; i < 3; i++) {
          let temp: number;
          let inRange: boolean;

          if (equip === "Walk-in Cooler") {
            temp = 35 + Math.random() * 6; // 35-41
            inRange = temp <= 40;
            // Make some out of range for alerts
            if (locId.endsWith("03") && i === 2) { temp = 44.2; inRange = false; }
            if (locId.endsWith("07") && i === 1) { temp = 42.8; inRange = false; }
          } else if (equip === "Freezer") {
            temp = -5 + Math.random() * 8; // -5 to 3
            inRange = temp <= 0;
            if (locId.endsWith("06") && i === 2) { temp = 8.5; inRange = false; }
          } else if (equip === "Hot Hold Line") {
            temp = 135 + Math.random() * 15; // 135-150
            inRange = temp >= 140;
            if (locId.endsWith("01") && i === 0) { temp = 132.1; inRange = false; }
          } else {
            temp = 34 + Math.random() * 6;
            inRange = temp <= 40;
          }

          tempRows.push({
            location_id: locId,
            equipment: equip,
            temperature: parseFloat(temp.toFixed(1)),
            logged_by: "Auto-Logger",
            logged_at: new Date(now.getTime() - (i * 4 + Math.random() * 2) * 3600000).toISOString(),
            in_range: inRange,
          });
        }
      }
    }

    const { error: tempError } = await supabase.from("va_temp_logs").insert(tempRows);
    if (tempError) throw new Error(`Temp logs insert failed: ${tempError.message}`);
    steps.push(`Created ${tempRows.length} temperature logs`);

    // Step 5: Training assignments
    const courses = [
      "ServSafe Food Handler",
      "ServSafe Manager Certification",
      "Allergen Awareness",
      "Workplace Safety",
      "Sexual Harassment Prevention",
      "Fire Extinguisher Training",
      "OSHA Compliance Basics",
      "Customer Service Excellence",
    ];

    const trainingRows: Record<string, unknown>[] = [];
    const firstNames = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Blake", "Drew", "Skyler", "Jamie", "Emery", "Dakota", "Reese"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];

    for (const locId of locationIds) {
      const empCount = locationData.find((l) => l.id === locId)?.staff_count || 15;
      // Each location has 3-5 training assignments
      const numTrainings = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numTrainings; i++) {
        const empName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
        const course = courses[Math.floor(Math.random() * courses.length)];
        const statuses = ["assigned", "in_progress", "completed", "overdue"];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const progress = status === "completed" ? 100 : status === "overdue" ? Math.floor(Math.random() * 50) : status === "in_progress" ? 30 + Math.floor(Math.random() * 60) : 0;

        const dueDate = new Date(now);
        if (status === "overdue") {
          dueDate.setDate(dueDate.getDate() - Math.floor(Math.random() * 14) - 1);
        } else if (status === "completed") {
          dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30));
        } else {
          dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30));
        }

        trainingRows.push({
          location_id: locId,
          employee_name: empName,
          course_name: course,
          status,
          progress,
          due_date: dueDate.toISOString().split("T")[0],
          completed_at: status === "completed" ? new Date(now.getTime() - Math.random() * 7 * 86400000).toISOString() : null,
        });
      }
    }

    const { error: trainError } = await supabase.from("va_training").insert(trainingRows);
    if (trainError) throw new Error(`Training insert failed: ${trainError.message}`);
    steps.push(`Created ${trainingRows.length} training assignments`);

    // Step 6: Incidents
    const incidentTypes = ["food_safety", "customer", "employee", "equipment"];
    const incidentRows: Record<string, unknown>[] = [];

    const incidentDescs: Record<string, string[]> = {
      food_safety: [
        "Walk-in cooler temperature exceeded 41F for over 30 minutes",
        "Employee observed not wearing gloves during food prep",
        "Expired dairy products found in storage",
        "Cross-contamination risk: raw chicken stored above ready-to-eat items",
      ],
      customer: [
        "Customer reported allergic reaction - no allergen communication",
        "Slip and fall in dining area - wet floor sign was not placed",
        "Customer complaint about undercooked food",
      ],
      employee: [
        "Employee burn from fryer - first aid administered",
        "Verbal altercation between two staff members during shift",
        "Employee reported working without required food handler certification",
      ],
      equipment: [
        "Dishwasher not reaching sanitizing temperature (160F required)",
        "Walk-in cooler compressor making unusual noise",
        "POS terminal #3 intermittently freezing",
      ],
    };

    // Create 8-12 incidents across locations
    for (let i = 0; i < 10; i++) {
      const locId = locationIds[Math.floor(Math.random() * locationIds.length)];
      const type = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
      const descs = incidentDescs[type];
      const desc = descs[Math.floor(Math.random() * descs.length)];
      const severities = ["low", "medium", "high", "critical"];
      const severity = type === "food_safety" ? severities[1 + Math.floor(Math.random() * 3)] : severities[Math.floor(Math.random() * severities.length)];
      const isResolved = Math.random() > 0.4;

      incidentRows.push({
        location_id: locId,
        type,
        severity,
        description: desc,
        reported_by: locationData.find((l) => l.id === locId)?.manager_name || "Staff",
        status: isResolved ? "resolved" : Math.random() > 0.5 ? "investigating" : "open",
        resolution: isResolved ? "Issue addressed and corrective action taken. Staff retrained." : null,
        created_at: new Date(now.getTime() - Math.random() * 14 * 86400000).toISOString(),
        resolved_at: isResolved ? new Date(now.getTime() - Math.random() * 7 * 86400000).toISOString() : null,
      });
    }

    const { error: incError } = await supabase.from("va_incidents").insert(incidentRows);
    if (incError) throw new Error(`Incidents insert failed: ${incError.message}`);
    steps.push(`Created ${incidentRows.length} incidents`);

    // Step 7: Hiring candidates
    const roles = ["Line Cook", "Server", "Host/Hostess", "Dishwasher", "Shift Lead", "Prep Cook", "Busser"];
    const stages = ["applied", "screened", "interview", "offered", "hired", "rejected"];
    const candidateRows: Record<string, unknown>[] = [];

    const candNames = [
      "Michael Torres", "Jessica Kim", "Brandon Lee", "Samantha Cruz",
      "David Patel", "Nicole Foster", "Anthony Wright", "Maria Gonzalez",
      "Christopher Hall", "Ashley Thompson", "Daniel Brooks", "Brittany Adams",
      "Joshua Rivera", "Amanda Clark", "Ryan Mitchell", "Stephanie Lewis",
      "Tyler Green", "Megan Young", "Austin King", "Lauren Scott",
    ];

    for (let i = 0; i < 20; i++) {
      const locId = locationIds[Math.floor(Math.random() * locationIds.length)];
      const stage = stages[Math.floor(Math.random() * stages.length)];
      const aiScore = stage === "applied" ? null : 40 + Math.floor(Math.random() * 55);

      candidateRows.push({
        location_id: locId,
        name: candNames[i],
        phone: `(${400 + Math.floor(Math.random() * 500)}) ${100 + Math.floor(Math.random() * 900)}-${1000 + Math.floor(Math.random() * 9000)}`,
        email: candNames[i].toLowerCase().replace(" ", ".") + "@email.com",
        role_applied: roles[Math.floor(Math.random() * roles.length)],
        stage,
        ai_score: aiScore,
        notes: stage === "screened" ? "AI screening complete" : stage === "interview" ? "Interview scheduled" : stage === "hired" ? "Onboarding in progress" : null,
        created_at: new Date(now.getTime() - Math.random() * 21 * 86400000).toISOString(),
      });
    }

    const { error: candError } = await supabase.from("va_candidates").insert(candidateRows);
    if (candError) throw new Error(`Candidates insert failed: ${candError.message}`);
    steps.push(`Created ${candidateRows.length} candidates`);

    return NextResponse.json({
      success: true,
      steps,
      summary: {
        organization: 1,
        locations: locationData.length,
        checklists: checklistRows.length,
        tempLogs: tempRows.length,
        training: trainingRows.length,
        incidents: incidentRows.length,
        candidates: candidateRows.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, steps, error: String(error) },
      { status: 500 }
    );
  }
}
