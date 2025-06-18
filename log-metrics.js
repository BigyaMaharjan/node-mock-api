const fs = require("fs");
const path = require("path");

const targetDate = "2025-06-17";
const fromTime = "11:00"; //keep these empty to filter from date only
const toTime = "17:00";

const parseTime = (timeStr) => {
  const [hour, minute] = timeStr.split(":").map(Number);
  return hour * 60 + minute;
};

const fromMinutes = parseTime(fromTime);
const toMinutes = parseTime(toTime);

const logPath = path.join(__dirname, "acmslogs.txt");
const logLines = fs.readFileSync(logPath, "utf-8").split("\n");

// ✅ Updated to capture date, hour, and minute properly (with ms and TZ offset)
const timestampPattern = /^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2}):\d{2}\.\d+ \+\d{2}:\d{2}/;
const requestPattern =
  /Request finished .* (POST|GET|PUT|DELETE) (https?:\/\/[^ ]+) - (\d+) .* ([\d.]+)ms/;
const servicePattern = /(\w+AppService) - (\w+)/;

function parseRequestLine(line, index) {
  const timeMatch = line.match(timestampPattern);
  if (!timeMatch || timeMatch[1] !== targetDate) return null;

  const hour = parseInt(timeMatch[2]);
  const minute = parseInt(timeMatch[3]);
  const totalMinutes = hour * 60 + minute;

  if (totalMinutes < fromMinutes || totalMinutes > toMinutes) return null;

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
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    method,
    url,
    status,
    duration,
    service,
    action,
  };
}

function findServiceAction(currentIndex) {
  for (let j = currentIndex - 1; j >= Math.max(0, currentIndex - 10); j--) {
    const svcMatch = logLines[j].match(servicePattern);
    if (svcMatch) {
      return { service: svcMatch[1], action: svcMatch[2] };
    }
  }
  return { service: "Unknown", action: "Unknown" };
}

const metrics = logLines
  .map((line, index) => parseRequestLine(line, index))
  .filter((entry) => entry !== null);

console.table(metrics);
