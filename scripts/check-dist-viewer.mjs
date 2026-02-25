#!/usr/bin/env node
import { readdirSync } from "fs";

console.log("Files in dist/viewer/:");
const files = readdirSync("dist/viewer");
files.forEach((f) => console.log("  -", f));
