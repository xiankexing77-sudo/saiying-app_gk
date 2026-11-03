import { mkdirSync, writeFileSync } from "node:fs";
import { database } from "../src/lib/data/seed";

mkdirSync("database/seed", { recursive: true });
writeFileSync("database/seed/swpa.json", `${JSON.stringify(database, null, 2)}\n`);
console.log(`wrote database/seed/swpa.json (${database.series.length} series, ${database.photographs.filter((photo) => photo.role === "standalone").length} singles)`);
