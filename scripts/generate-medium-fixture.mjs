/**
 * Generate a ~200KB medium.json fixture for testing EditView large-file mode.
 */
import { writeFileSync } from "fs";

const departments = [
	"Engineering",
	"Design",
	"Product",
	"Marketing",
	"Sales",
	"HR",
	"Finance",
	"Legal",
	"Support",
	"DevOps",
];
const roles = [
	"Senior Engineer",
	"Staff Engineer",
	"Junior Engineer",
	"Designer",
	"Product Manager",
	"Analyst",
	"Director",
	"VP",
	"Lead",
	"Intern",
];
const skillSets = [
	["React", "TypeScript", "Node.js", "PostgreSQL", "GraphQL"],
	["Python", "Django", "AWS", "Docker", "Kubernetes"],
	["Java", "Spring Boot", "MySQL", "Redis", "Kafka"],
	["Go", "gRPC", "MongoDB", "Terraform", "CI/CD"],
	["Figma", "UI/UX", "Prototyping", "Design Systems", "CSS"],
	["Agile", "Roadmapping", "Analytics", "Jira", "OKRs"],
	["Leadership", "Strategy", "Finance", "Operations", "Hiring"],
	["SEO", "Content", "Social Media", "Email Marketing", "PPC"],
	["Salesforce", "HubSpot", "Negotiation", "Pipeline", "CRM"],
	["Vue.js", "Svelte", "Rust", "WebAssembly", "Three.js"],
];
const firstNames = [
	"Alice",
	"Bob",
	"Carol",
	"David",
	"Eva",
	"Frank",
	"Grace",
	"Henry",
	"Iris",
	"Jack",
	"Kate",
	"Liam",
	"Mia",
	"Noah",
	"Olivia",
	"Paul",
	"Quinn",
	"Ryan",
	"Sara",
	"Tom",
	"Uma",
	"Vic",
	"Wendy",
	"Xander",
	"Yara",
	"Zane",
];
const lastNames = [
	"Johnson",
	"Smith",
	"Williams",
	"Brown",
	"Martinez",
	"Davis",
	"Garcia",
	"Wilson",
	"Anderson",
	"Taylor",
	"Thomas",
	"Moore",
	"Jackson",
	"Martin",
	"Lee",
	"Harris",
	"Clark",
	"Lewis",
	"Walker",
	"Hall",
	"Young",
	"King",
	"Wright",
	"Lopez",
	"Hill",
	"Scott",
	"Green",
	"Adams",
	"Baker",
	"Nelson",
];
const cities = [
	"San Francisco",
	"New York",
	"Seattle",
	"Austin",
	"Denver",
	"Chicago",
	"Boston",
	"Portland",
	"Miami",
	"Atlanta",
];
const states = ["CA", "NY", "WA", "TX", "CO", "IL", "MA", "OR", "FL", "GA"];
const streets = ["Main St", "Oak Ave", "Pine Rd", "Elm Blvd", "Cedar Ln"];
const projectNames = [
	"CloudSync",
	"DataVault",
	"Analytics",
	"DevPortal",
	"MobileApp",
	"APIGateway",
	"MLPipeline",
	"Dashboard",
];
const projectSuffix = ["v2", "Rewrite", "Migration", "Upgrade", "Integration"];
const projectStatus = ["active", "completed", "on-hold", "planning"];
const categories = [
	"SaaS",
	"Security",
	"Business Intelligence",
	"DevTools",
	"Infrastructure",
	"AI/ML",
	"Communication",
	"Analytics",
	"Automation",
	"Monitoring",
];
const productNames = [
	"CloudSync",
	"DataVault",
	"Analytics",
	"DevPortal",
	"MobileKit",
	"APIGateway",
	"MLEngine",
	"DashView",
	"AutoDeploy",
	"MonitorPro",
];
const productTiers = ["Pro", "Enterprise", "Starter", "Team", "Ultimate"];
const allFeatures = [
	"Real-time sync",
	"Offline mode",
	"Team collaboration",
	"SSO",
	"Audit logs",
	"API access",
	"Custom reports",
	"Data export",
	"Webhooks",
	"Role-based access",
];
const capabilites = [
	"analytics",
	"security",
	"automation",
	"monitoring",
	"collaboration",
];

// Build employees (80)
const employees = [];
for (let i = 1; i <= 90; i++) {
	const fn = firstNames[i % firstNames.length];
	const ln = lastNames[i % lastNames.length];
	const year = 2015 + (i % 11);
	const month = String((i % 12) + 1).padStart(2, "0");
	const day = String((i % 28) + 1).padStart(2, "0");
	employees.push({
		id: i,
		name: `${fn} ${ln}`,
		email: `${fn.toLowerCase()}.${ln.toLowerCase()}@techcorp.com`,
		role: roles[i % roles.length],
		department: departments[i % departments.length],
		salary: 80000 + i * 2500,
		startDate: `${year}-${month}-${day}`,
		active: i % 7 !== 0,
		skills: skillSets[i % skillSets.length],
		address: {
			street: `${100 + i} ${streets[i % streets.length]}`,
			city: cities[i % cities.length],
			state: states[i % states.length],
			zip: String(10000 + i * 137),
		},
		performance: {
			rating: +(3.0 + (i % 20) * 0.1).toFixed(1),
			lastReview: `2025-${month}-15`,
			goals: [
				"Increase throughput by 20%",
				"Mentor 2 junior devs",
				`Ship v${(i % 5) + 1}.0`,
				"Improve test coverage",
				"Reduce latency by 30%",
			].slice(0, 2 + (i % 3)),
			notes: `Performance review notes for employee #${i}. Overall strong contributor with consistent delivery across multiple quarters. Shows initiative in cross-team collaboration and technical mentorship.`,
		},
		projects: Array.from({ length: 2 + (i % 4) }, (_, j) => ({
			id: `proj-${String(i * 100 + j).padStart(5, "0")}`,
			name: `${projectNames[j % projectNames.length]} ${projectSuffix[i % projectSuffix.length]}`,
			status: projectStatus[j % projectStatus.length],
			hoursLogged: 40 + ((i * 7 + j * 13) % 200),
			startDate: `2024-${String((j % 12) + 1).padStart(2, "0")}-01`,
		})),
	});
}

// Build products (40)
const products = [];
for (let i = 1; i <= 40; i++) {
	products.push({
		id: `prod-${String(i).padStart(3, "0")}`,
		name: `${productNames[i % productNames.length]} ${productTiers[i % productTiers.length]}`,
		category: categories[i % categories.length],
		price: +(9.99 + i * 15.5).toFixed(2),
		currency: "USD",
		features: allFeatures.slice(0, 3 + (i % 5)),
		rating: +(3.5 + (i % 15) * 0.1).toFixed(1),
		reviews: 100 + i * 67,
		description: `A comprehensive ${categories[i % categories.length].toLowerCase()} solution designed for modern teams. Features include advanced ${capabilites[i % capabilites.length]} capabilities with enterprise-grade reliability and 99.9% uptime SLA.`,
		releaseDate: `2024-${String((i % 12) + 1).padStart(2, "0")}-01`,
		changelog: Array.from({ length: 3 }, (_, j) => ({
			version: `${3 - j}.${i % 10}.0`,
			date: `${2026 - j}-01-15`,
			changes: [
				"Bug fixes and performance improvements",
				"New dashboard widgets added",
				"API v2 support",
				"Enhanced security features",
				"Improved onboarding flow",
			].slice(0, 2 + (j % 2)),
		})),
	});
}

// Analytics section
const monthlyMetrics = Array.from({ length: 24 }, (_, i) => {
	const year = 2024 + Math.floor(i / 12);
	const month = (i % 12) + 1;
	return {
		period: `${year}-${String(month).padStart(2, "0")}`,
		revenue: +(500000 + Math.sin(i) * 100000 + i * 25000).toFixed(2),
		expenses: +(350000 + Math.cos(i) * 50000 + i * 15000).toFixed(2),
		newCustomers: 150 + ((i * 23) % 200),
		churnRate: +(1.5 + Math.sin(i * 0.5) * 0.8).toFixed(2),
		activeUsers: 5000 + i * 800,
		apiCalls: 1000000 + i * 250000,
		avgResponseTime: +(45 + Math.sin(i * 0.3) * 15).toFixed(1),
		errorRate: +(0.1 + Math.abs(Math.sin(i * 1.7)) * 0.05).toFixed(3),
		regions: {
			northAmerica: +(0.45 + Math.sin(i) * 0.05).toFixed(3),
			europe: +(0.3 + Math.cos(i) * 0.03).toFixed(3),
			asia: +(0.15 + Math.sin(i * 0.7) * 0.02).toFixed(3),
			other: +(0.1).toFixed(3),
		},
	};
});

const data = {
	company: {
		name: "TechCorp Industries",
		founded: 2015,
		headquarters: {
			city: "San Francisco",
			state: "CA",
			country: "USA",
			coordinates: { lat: 37.7749, lng: -122.4194 },
		},
	},
	employees,
	products,
	analytics: { monthlyMetrics },
	metadata: {
		lastUpdated: "2026-02-23T10:30:00Z",
		version: "3.2.1",
		apiVersion: "v2",
	},
};

const json = JSON.stringify(data, null, 2);
const sizeKB = (Buffer.byteLength(json) / 1024).toFixed(1);
const lines = json.split("\n").length;

writeFileSync("demo/fixtures/medium.json", json);
console.log(`Generated demo/fixtures/medium.json`);
console.log(`  Size: ${sizeKB} KB`);
console.log(`  Lines: ${lines}`);
