const fs = require("fs");
const types = fs.readFileSync("src/shared/i18n/types.ts", "utf8");
const en = fs.readFileSync("src/shared/i18n/en.ts", "utf8");
const es = fs.readFileSync("src/shared/i18n/es.ts", "utf8");
const pt = fs.readFileSync("src/shared/i18n/pt.ts", "utf8");

function extractInterfaceKeys(content) {
	const keys = [];
	const re = /"([^"]+)":\s*string/g;
	let m;
	while ((m = re.exec(content)) !== null) keys.push(m[1]);
	return keys;
}

function extractObjectKeys(content) {
	const keys = [];
	const re = /"([^"]+)":\s*["']/g;
	let m;
	while ((m = re.exec(content)) !== null) keys.push(m[1]);
	return keys;
}

const typeKeys = extractInterfaceKeys(types);
const enKeys = extractObjectKeys(en);
const esKeys = extractObjectKeys(es);
const ptKeys = extractObjectKeys(pt);

console.log("KEY COUNTS");
console.log("types.ts:", typeKeys.length);
console.log("en.ts:", enKeys.length);
console.log("es.ts:", esKeys.length);
console.log("pt.ts:", ptKeys.length);

function diff(a, b) {
	const setB = new Set(b);
	return a.filter((k) => !setB.has(k));
}

const enMissing = diff(typeKeys, enKeys);
const enExtra = diff(enKeys, typeKeys);
const esMissing = diff(typeKeys, esKeys);
const esExtra = diff(esKeys, typeKeys);
const ptMissing = diff(typeKeys, ptKeys);
const ptExtra = diff(ptKeys, typeKeys);

console.log(
	"\nEN MISSING:",
	enMissing.length ? JSON.stringify(enMissing) : "NONE",
);
console.log("EN EXTRA:", enExtra.length ? JSON.stringify(enExtra) : "NONE");
console.log(
	"\nES MISSING:",
	esMissing.length ? JSON.stringify(esMissing) : "NONE",
);
console.log("ES EXTRA:", esExtra.length ? JSON.stringify(esExtra) : "NONE");
console.log(
	"\nPT MISSING:",
	ptMissing.length ? JSON.stringify(ptMissing) : "NONE",
);
console.log("PT EXTRA:", ptExtra.length ? JSON.stringify(ptExtra) : "NONE");
