import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const ORG_ID = "00000000-0000-0000-0000-000000000001";

const LOCATIONS = [
  { name: "IHOP #1 — Capital Blvd", address: "3741 Capital Blvd, Raleigh, NC 27604" },
  { name: "IHOP #2 — Glenwood Ave", address: "4600 Glenwood Ave, Raleigh, NC 27612" },
  { name: "IHOP #3 — S Wilmington St", address: "1313 S Wilmington St, Raleigh, NC 27601" },
  { name: "IHOP #4 — Durham-Chapel Hill Blvd", address: "3710 Durham-Chapel Hill Blvd, Durham, NC 27707" },
  { name: "IHOP #5 — Roxboro Rd", address: "3825 N Roxboro Rd, Durham, NC 27704" },
  { name: "IHOP #6 — Fayetteville Rd", address: "4015 Fayetteville Rd, Durham, NC 27713" },
  { name: "IHOP #7 — Walnut St Cary", address: "1100 Walnut St, Cary, NC 27511" },
  { name: "IHOP #8 — US-70 Garner", address: "2800 Aversboro Rd, Garner, NC 27529" },
  { name: "IHOP #9 — S Main St Wake Forest", address: "1201 S Main St, Wake Forest, NC 27587" },
  { name: "IHOP #10 — N Harrison Ave", address: "710 N Harrison Ave, Cary, NC 27513" },
];

const ROLES = ["server", "cook", "host", "dishwasher", "manager"];

const FIRST_NAMES = [
  "Maria", "James", "Rosa", "David", "Sarah", "Kevin", "Lisa", "Marcus",
  "Jennifer", "Robert", "Angela", "Carlos", "Michelle", "Brandon", "Nicole",
  "Derek", "Tanya", "Miguel", "Heather", "Andre", "Patricia", "Jason",
  "Crystal", "Raymond", "Stephanie", "Victor", "Diana", "Tyler", "Monica", "Sean",
  "Ashley", "Brian", "Wendy", "Eric", "Tamika", "Frank", "Sandra", "Greg",
  "Julia", "Keith", "Laura", "Darius", "Amy", "Ronald", "Teresa", "Louis",
  "Karen", "Wayne", "Gloria", "Henry"
];

const LAST_NAMES = [
  "Johnson", "Garcia", "Smith", "Williams", "Brown", "Rodriguez", "Davis",
  "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor",
  "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris",
  "Sanchez", "Clark", "Lewis", "Robinson", "Walker", "Young", "Allen", "King"
];

const EQUIPMENT = ["Walk-In Cooler", "Walk-In Freezer", "Prep Line Cooler", "Hot Hold Station", "Grill Station"];

function randomPhone() {
  return `+1919${Math.floor(1000000 + Math.random() * 9000000)}`;
}

function randomDate(daysFromNow: number, variance: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow + Math.floor(Math.random() * variance * 2 - variance));
  return d.toISOString();
}

export async function seed() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const results: string[] = [];

  // 1. Create org if not exists
  const { data: existingOrg } = await supabase.from("organizations").select("id").eq("id", ORG_ID).single();
  if (!existingOrg) {
    await supabase.from("organizations").insert({
      id: ORG_ID,
      name: "IHOP Southeast Region",
      plan: "enterprise",
    });
    results.push("Created organization: IHOP Southeast Region");
  }

  // 2. Create locations
  const locationIds: string[] = [];
  for (const loc of LOCATIONS) {
    const { data: existing } = await supabase.from("locations").select("id").eq("name", loc.name).single();
    if (existing) {
      locationIds.push(existing.id);
    } else {
      const { data } = await supabase.from("locations").insert({
        organization_id: ORG_ID,
        name: loc.name,
        address: loc.address,
      }).select("id").single();
      if (data) locationIds.push(data.id);
    }
  }
  results.push(`Locations: ${locationIds.length} ready`);

  // 3. Create employees (5 per location = 50 total)
  let empCount = 0;
  const employeeIds: string[] = [];
  for (let i = 0; i < locationIds.length; i++) {
    for (let r = 0; r < ROLES.length; r++) {
      const idx = i * 5 + r;
      const firstName = FIRST_NAMES[idx % FIRST_NAMES.length];
      const lastName = LAST_NAMES[idx % LAST_NAMES.length];
      const fullName = `${firstName} ${lastName}`;

      const { data: existing } = await supabase
        .from("employees")
        .select("id")
        .eq("name", fullName)
        .eq("location_id", locationIds[i])
        .single();

      if (existing) {
        employeeIds.push(existing.id);
      } else {
        const { data } = await supabase.from("employees").insert({
          organization_id: ORG_ID,
          location_id: locationIds[i],
          name: fullName,
          role: ROLES[r],
          phone: randomPhone(),
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@ihop-demo.com`,
        }).select("id").single();
        if (data) {
          employeeIds.push(data.id);
          empCount++;
        }
      }
    }
  }
  results.push(`Employees: ${empCount} created (${employeeIds.length} total)`);

  // 4. Certifications (some expiring soon, some expired)
  let certCount = 0;
  for (let i = 0; i < employeeIds.length; i++) {
    const role = ROLES[i % ROLES.length];
    if (role === "cook" || role === "manager" || role === "server") {
      // Vary expiry: most valid, some expiring in 7-30 days, 2-3 expired
      let expiryDays = 180 + Math.floor(Math.random() * 365); // most valid
      if (i % 8 === 0) expiryDays = Math.floor(Math.random() * 25) + 5; // expiring soon
      if (i % 15 === 0) expiryDays = -Math.floor(Math.random() * 30) - 1; // expired

      const { data: existing } = await supabase
        .from("certifications")
        .select("id")
        .eq("employee_id", employeeIds[i])
        .eq("cert_type", "ServSafe Food Handler")
        .single();

      if (!existing) {
        await supabase.from("certifications").insert({
          employee_id: employeeIds[i],
          cert_type: "ServSafe Food Handler",
          issued_date: randomDate(-365, 30),
          expiry_date: randomDate(expiryDays, 5),
        });
        certCount++;
      }
    }
  }
  results.push(`Certifications: ${certCount} created`);

  // 5. Temp log schedules
  let schedCount = 0;
  for (const locId of locationIds) {
    for (const equip of EQUIPMENT) {
      const { data: existing } = await supabase
        .from("temp_log_schedule")
        .select("id")
        .eq("location_id", locId)
        .eq("equipment_name", equip)
        .single();

      if (!existing) {
        await supabase.from("temp_log_schedule").insert({
          location_id: locId,
          equipment_name: equip,
          scheduled_times: ["06:00", "11:00", "16:00", "21:00"],
          grace_period_min: 30,
          assigned_role: equip.includes("Grill") || equip.includes("Hot") ? "cook" : "cook",
        });
        schedCount++;
      }
    }
  }
  results.push(`Temp log schedules: ${schedCount} created`);

  // 6. Staffing targets
  const TARGETS: Record<string, { target: number; min: number }> = {
    server: { target: 8, min: 5 },
    cook: { target: 4, min: 3 },
    host: { target: 2, min: 1 },
    dishwasher: { target: 2, min: 1 },
    manager: { target: 2, min: 1 },
  };

  let targetCount = 0;
  for (const locId of locationIds) {
    for (const [role, counts] of Object.entries(TARGETS)) {
      const { data: existing } = await supabase
        .from("staffing_targets")
        .select("id")
        .eq("location_id", locId)
        .eq("role", role)
        .single();

      if (!existing) {
        await supabase.from("staffing_targets").insert({
          location_id: locId,
          role,
          target_count: counts.target,
          min_count: counts.min,
        });
        targetCount++;
      }
    }
  }
  results.push(`Staffing targets: ${targetCount} created`);

  // 7. Sample temp logs (mix of compliant + violations)
  let logCount = 0;
  const today = new Date();
  for (let h = 0; h < 3; h++) { // last 3 check times
    for (let l = 0; l < Math.min(locationIds.length, 6); l++) { // first 6 locations have logs
      for (const equip of EQUIPMENT.slice(0, 3)) { // first 3 equipment types
        const isCold = equip.includes("Cooler") || equip.includes("Freezer");
        let temp: number;
        if (Math.random() < 0.1) {
          // 10% chance violation
          temp = isCold ? 45 + Math.floor(Math.random() * 10) : 120 + Math.floor(Math.random() * 10);
        } else {
          temp = isCold ? 34 + Math.floor(Math.random() * 5) : 140 + Math.floor(Math.random() * 15);
        }

        const logTime = new Date(today);
        logTime.setHours([6, 11, 16][h], Math.floor(Math.random() * 30));

        await supabase.from("temp_logs").insert({
          location_id: locationIds[l],
          equipment_name: equip,
          temperature: temp,
          recorded_by: employeeIds[l * 5 + 1], // cook at each location
          recorded_at: logTime.toISOString(),
        });
        logCount++;
      }
    }
  }
  results.push(`Temp logs: ${logCount} sample entries created`);

  return results;
}
