const fs = require("fs");
const path = require("path");

// 🗓️ Configurable target date (YYYY-MM-DD)
const targetDate = "2025-06-17";
const logPath = path.join(__dirname, "acmslogs.txt");

// Load and split log lines
const logLines = fs.readFileSync(logPath, "utf-8").split("\n");

// Regex patterns
const requestPattern =
  /Request finished .* (POST|GET|PUT|DELETE) (https?:\/\/[^ ]+) - (\d+) .* ([\d.]+)ms/;
const servicePattern = /(\w+AppService) - (\w+)/;
const timestampPattern = /^(\d{4}-\d{2}-\d{2}) \d{2}:\d{2}:\d{2}/;

// Helper to parse a single log line
function parseRequestLine(line, index) {
  const timeMatch = line.match(timestampPattern);
  if (!timeMatch || timeMatch[1] !== targetDate) return null;

  const requestMatch = line.match(requestPattern);
  if (!requestMatch) return null;

  const method = requestMatch[1];
  const url = requestMatch[2];
  const status = parseInt(requestMatch[3]);
  const duration = parseFloat(requestMatch[4]);
  const apiPath = new URL(url).pathname;

  if (!apiPath.startsWith("/api")) return null;

  const { service, action } = findServiceAction(index);
  return {
    date: timeMatch[1],
    method,
    url,
    status,
    duration,
    service,
    action,
  };
}

// Backtrace to find related service/action logs
function findServiceAction(currentIndex) {
  for (let j = currentIndex - 1; j >= Math.max(0, currentIndex - 10); j--) {
    const svcMatch = logLines[j].match(servicePattern);
    if (svcMatch) {
      return { service: svcMatch[1], action: svcMatch[2] };
    }
  }
  return { service: "Unknown", action: "Unknown" };
}

// Extract metrics
const metrics = logLines
  .map((line, index) => parseRequestLine(line, index))
  .filter(entry => entry !== null);

// Show results
console.table(metrics);
