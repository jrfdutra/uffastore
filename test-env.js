import fs from "fs";
import path from "path";
const raw = fs.readFileSync(path.resolve(".env"), "utf8");
console.log("Raw:", JSON.stringify(raw));
const env = {};
for (const line of raw.split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (match) {
    env[match[1]] = match[2].replace(/^[\"']|[\"']$/g, "");
  }
}
console.log("Parsed:", env);
console.log("Keys:", Object.keys(env));
