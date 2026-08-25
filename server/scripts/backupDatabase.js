#!/usr/bin/env node
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const mongoUri = String(process.env.MONGO_URI || "").trim();
const outputRoot = path.resolve(process.env.BACKUP_DIR || path.join(__dirname, "..", "backups"));

if (!mongoUri) {
  console.error("MONGO_URI must be configured before creating a backup.");
  process.exit(1);
}

fs.mkdirSync(outputRoot, { recursive: true, mode: 0o700 });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = path.join(outputRoot, `angels-home-${stamp}`);
fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 });

const args = ["--uri", mongoUri, "--out", outputDir, "--gzip"];
const child = spawn("mongodump", args, { stdio: "inherit", shell: false });

child.on("error", (error) => {
  console.error(`Unable to start mongodump: ${error.message}`);
  console.error("Install MongoDB Database Tools and ensure mongodump is on PATH.");
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (code === 0) {
    console.log(`Database backup created: ${outputDir}`);
    return;
  }
  console.error(`Database backup failed${signal ? ` (${signal})` : ""}.`);
  process.exit(code || 1);
});
