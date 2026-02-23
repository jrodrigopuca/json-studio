import { writeFileSync } from "node:fs";

const cities = ["New York","London","Tokyo","Paris","Berlin","Sydney","Toronto","São Paulo","Mumbai","Seoul","Dubai","Singapore","Amsterdam","Stockholm","Barcelona"];
const plans = ["free","starter","pro","enterprise"];
const statuses = ["active","inactive","suspended","pending"];
const browsers = ["Chrome","Firefox","Safari","Edge","Opera"];
const oses = ["Windows","macOS","Linux","iOS","Android"];
const countries = ["US","GB","JP","FR","DE","AU","CA","BR","IN","KR","AE","SG","NL","SE","ES"];
const departments = ["Engineering","Product","Design","Marketing","Sales","Support","Operations","Finance","Legal","HR"];
const roles = ["admin","editor","viewer","manager","analyst"];
const pageNames = ["dashboard","settings","profile","reports","billing","analytics","users","integrations"];
const pageTitles = ["Dashboard","Settings","Profile","Reports","Billing","Analytics","Users","Integrations"];
const firstNames = ["Alice","Bob","Carlos","Diana","Elena","Frank","Grace","Hugo","Irene","Jack","Karen","Leo","Maria","Noah","Olivia","Pablo","Quinn","Rosa","Sam","Tina"];
const lastNames = ["Smith","Johnson","Williams","Brown","Jones","García","Miller","Davis","Rodriguez","Martinez","Anderson","Taylor","Thomas","Hernandez","Moore"];
const domains = ["gmail.com","outlook.com","company.io","example.org","startup.dev"];
const referrers = [null,"https://google.com","https://twitter.com","https://github.com","direct","https://linkedin.com"];
const utmSources = ["google","twitter","newsletter","partner"];
const utmMediums = ["cpc","organic","email","referral"];
const tags = ["vip","beta_tester","early_adopter","churned","at_risk","power_user","enterprise","startup"];
const currencies = ["USD","EUR","GBP","BRL"];
const billingCycles = ["monthly","annual"];
const paymentMethods = ["card","paypal","wire","crypto"];
const scopes = ["read:users","write:users","read:reports","write:reports","read:billing","admin:all"];
const deviceTypes = ["desktop","mobile","tablet"];

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rndInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rndDate(startY, endY) {
  const start = new Date(startY, 0, 1).getTime();
  const end = new Date(endY, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start)).toISOString();
}
function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

const users = [];

for (let i = 0; i < 2000; i++) {
  const sessCount = rndInt(1, 200);
  const numSess = Math.min(sessCount, rndInt(1, 5));
  const sessions = [];

  for (let s = 0; s < numSess; s++) {
    const numPages = rndInt(1, 8);
    const pages = [];
    for (let p = 0; p < numPages; p++) {
      pages.push({
        url: "/app/" + rnd(pageNames),
        title: rnd(pageTitles),
        duration_ms: rndInt(500, 120000),
        timestamp: rndDate(2025, 2025),
        events: rndInt(0, 15)
      });
    }
    sessions.push({
      session_id: uuid(),
      started_at: rndDate(2025, 2025),
      duration_seconds: rndInt(30, 7200),
      browser: rnd(browsers),
      os: rnd(oses),
      device_type: rnd(deviceTypes),
      pages_visited: pages,
      referrer: rnd(referrers),
      utm: Math.random() > 0.7
        ? { source: rnd(utmSources), medium: rnd(utmMediums), campaign: "campaign_" + rndInt(1, 50) }
        : null
    });
  }

  users.push({
    id: uuid(),
    email: "user" + i + "@" + rnd(domains),
    name: rnd(firstNames) + " " + rnd(lastNames),
    avatar_url: "https://avatars.example.com/" + uuid() + ".jpg",
    plan: rnd(plans),
    status: rnd(statuses),
    role: rnd(roles),
    department: rnd(departments),
    location: {
      city: rnd(cities),
      country: rnd(countries),
      timezone: "UTC" + (rndInt(-12, 12) >= 0 ? "+" : "") + rndInt(-12, 12)
    },
    created_at: rndDate(2020, 2025),
    last_login: rndDate(2025, 2025),
    metadata: {
      total_sessions: sessCount,
      total_events: rndInt(100, 50000),
      total_page_views: rndInt(50, 25000),
      avg_session_duration: rndInt(60, 3600),
      feature_flags: {
        new_dashboard: Math.random() > 0.5,
        beta_analytics: Math.random() > 0.7,
        dark_mode: Math.random() > 0.3,
        export_csv: Math.random() > 0.4,
        api_v2: Math.random() > 0.6
      },
      subscription: {
        mrr: parseFloat((Math.random() * 500).toFixed(2)),
        currency: rnd(currencies),
        billing_cycle: rnd(billingCycles),
        next_billing_date: rndDate(2026, 2026),
        payment_method: rnd(paymentMethods)
      },
      tags: Array.from({ length: rndInt(0, 5) }, () => rnd(tags))
    },
    recent_sessions: sessions,
    permissions: {
      can_export: Math.random() > 0.3,
      can_invite: Math.random() > 0.5,
      can_delete: Math.random() > 0.8,
      can_admin: Math.random() > 0.9,
      scopes: Array.from({ length: rndInt(1, 6) }, () => rnd(scopes))
    }
  });
}

const data = {
  _metadata: {
    generated_at: new Date().toISOString(),
    version: "2.1.0",
    total_users: users.length,
    query: {
      filters: { status: ["active", "inactive"], date_range: { from: "2025-01-01", to: "2025-12-31" } },
      sort: { field: "last_login", order: "desc" },
      pagination: { page: 1, per_page: 2000, total_pages: 1, total_records: users.length }
    },
    execution_time_ms: 1247,
    cache: { hit: false, ttl: 300, key: "analytics:users:2025" }
  },
  summary: {
    by_plan: {
      free: users.filter(u => u.plan === "free").length,
      starter: users.filter(u => u.plan === "starter").length,
      pro: users.filter(u => u.plan === "pro").length,
      enterprise: users.filter(u => u.plan === "enterprise").length
    },
    by_status: {
      active: users.filter(u => u.status === "active").length,
      inactive: users.filter(u => u.status === "inactive").length,
      suspended: users.filter(u => u.status === "suspended").length,
      pending: users.filter(u => u.status === "pending").length
    },
    total_mrr: parseFloat(users.reduce((s, u) => s + u.metadata.subscription.mrr, 0).toFixed(2)),
    avg_sessions: Math.round(users.reduce((s, u) => s + u.metadata.total_sessions, 0) / users.length)
  },
  users
};

const json = JSON.stringify(data, null, 2);
writeFileSync("demo/fixtures/large-analytics.json", json);
const sizeMB = (Buffer.byteLength(json) / 1024 / 1024).toFixed(2);
const lines = json.split("\n").length;
console.log(`Created: ${sizeMB} MB, ${lines} lines, ${users.length} users`);
