const fs = require("fs");
const path = require("path");

// Helper to parse time strings like "09:00" into minutes from midnight
const parseTime = (timeStr) => {
  if (!timeStr) return null;
  const [hour, minute] = timeStr.split(":").map(Number);
  return hour * 60 + minute;
};

// Process command-line arguments in groups of 4 (filename, date, fromTime, toTime)
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("❌ Please provide at least one log file name as argument.");
  console.error("👉 Example:");
  console.error("   node log-metrics.js logs.txt 2025-06-17 03:00 06:00");
  process.exit(1);
}

// Parse args into an array of filters
// Each filter: { filename, targetDate, fromMinutes, toMinutes }
const filters = [];

for (let i = 0; i < args.length; i += 4) {
  const filename = args[i];
  if (!filename) break;

  const targetDate = args[i + 1] || new Date().toISOString().split("T")[0];
  const fromTime = args[i + 2] || "";
  const toTime = args[i + 3] || "";

  filters.push({
    filename,
    targetDate,
    fromMinutes: parseTime(fromTime),
    toMinutes: parseTime(toTime),
  });
}

const timestampPattern =
  /^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2}):\d{2}\.\d+ \+\d{2}:\d{2}/;
const requestPattern =
  /Request finished .* (POST|GET|PUT|DELETE) (https?:\/\/[^ ]+) - (200) .* ([\d.]+)ms/;

// For each file and its filter, process and collect metrics
let allMetrics = [];

filters.forEach(({ filename, targetDate, fromMinutes, toMinutes }) => {
  const logPath = path.join(__dirname, filename);
  if (!fs.existsSync(logPath)) {
    console.warn(`⚠️ File not found: ${filename}. Skipping.`);
    return;
  }

  const logLines = fs.readFileSync(logPath, "utf-8").split("\n");

  const seenGetByIdPaths = new Set();

  logLines.forEach((line) => {
    const timeMatch = line.match(timestampPattern);
    if (!timeMatch || timeMatch[1] !== targetDate) return;

    const hour = parseInt(timeMatch[2]);
    const minute = parseInt(timeMatch[3]);
    const totalMinutes = hour * 60 + minute;

    if (
      (fromMinutes !== null && totalMinutes < fromMinutes) ||
      (toMinutes !== null && totalMinutes > toMinutes)
    )
      return;

    const requestMatch = line.match(requestPattern);
    if (!requestMatch) return;

    const method = requestMatch[1];
    const url = requestMatch[2];
    const duration = parseFloat(requestMatch[4]);
    const fullPath = new URL(url).pathname;
    const apiPath = fullPath.split("/api/")[1];
    if (!apiPath) return;

    // Normalize potential GUIDs or numeric IDs (e.g. item/abc123 → item/:id)
    const isGetMethod = method === "GET";
    const isParamBased = url.includes("?");
    const normalizedPath = apiPath.replace(
      /([a-fA-F0-9\-]{8,}|[0-9]+)/g,
      ":id"
    );

    // Avoid duplicates only for GET-by-ID, not for query param ones
    if (isGetMethod && !isParamBased) {
      const key = `${method} ${normalizedPath}`;
      if (seenGetByIdPaths.has(key)) return;
      seenGetByIdPaths.add(key);
    }

    allMetrics.push({
      filename,
      date: timeMatch[1],
      time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(
        2,
        "0"
      )}`,
      method,
      apiPath,
      duration,
      durationSeconds: Number((duration / 1000).toFixed(3)),
    });
  });
});

// Sort all results by duration descending
allMetrics.sort((a, b) => b.duration - a.duration);

console.table(allMetrics);
