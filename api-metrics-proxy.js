const axios = require("axios");
const https = require("https");

const agent = new https.Agent({ rejectUnauthorized: false });

// === CLI Usage ===
// node api-metrics-proxy.js [endpoint] [iterations]
// Example with ID: node api-metrics-proxy.js https://localhost:44377/api/app/item/123 5
// Example without ID: node api-metrics-proxy.js https://localhost:44377/api/app/item

const TARGET_URL = process.argv[2] || "https://localhost:44377/api/app/item";
const ITERATIONS = parseInt(process.argv[3] || "5");

const metrics = {
  count: 0,
  totalTime: 0,
  minTime: null,
  maxTime: null,
  avgTime: 0,
  statusCodes: {}
};

async function measure() {
  console.log(`📡 Measuring metrics for: ${TARGET_URL}`);
  console.log(`🔁 Iterations: ${ITERATIONS}\n`);

  for (let i = 0; i < ITERATIONS; i++) {
    const start = Date.now();
    try {
      const response = await axios.get(TARGET_URL, { httpsAgent: agent });
      const duration = Date.now() - start;

      metrics.count++;
      metrics.totalTime += duration;
      metrics.minTime = metrics.minTime === null ? duration : Math.min(metrics.minTime, duration);
      metrics.maxTime = metrics.maxTime === null ? duration : Math.max(metrics.maxTime, duration);
      const status = response.status;
      metrics.statusCodes[status] = (metrics.statusCodes[status] || 0) + 1;

      console.log(`[${i + 1}] ✅ ${status} in ${duration} ms`);
    } catch (err) {
      const duration = Date.now() - start;
      metrics.count++;
      metrics.totalTime += duration;
      metrics.minTime = metrics.minTime === null ? duration : Math.min(metrics.minTime, duration);
      metrics.maxTime = metrics.maxTime === null ? duration : Math.max(metrics.maxTime, duration);
      const status = err.response?.status || "ERR";
      metrics.statusCodes[status] = (metrics.statusCodes[status] || 0) + 1;

      console.log(`[${i + 1}] ❌ ${status} in ${duration} ms`);
    }
  }

  metrics.avgTime = parseFloat((metrics.totalTime / metrics.count).toFixed(2));

  console.log("\n📊 Metrics Summary:");
  console.table(metrics);
}

measure();
