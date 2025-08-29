const axios = require("axios");
const fs = require("fs");
import { ApifyClient } from 'apify-client';

const APIFY_TOKEN = "-";
const ACTOR_ID = "scrape-creators/best-tiktok-scraper";

const scrapeTikTok = async () => {
  try {
    // Read URL from input.json
    const url = JSON.parse(fs.readFileSync("input.json", "utf8")).url;

    // Start the Apify actor run
    const startRun = await axios.post(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
      { startUrls: [{ url }] }
    );

    const runId = startRun.data.data.id;
    let finished = false;
    let result;

    // Poll until actor finishes
    while (!finished) {
      const runStatus = await axios.get(
        `https://api.apify.com/v2/acts/${ACTOR_ID}/runs/${runId}?token=${APIFY_TOKEN}`
      );
      const status = runStatus.data.data.status;

      if (status === "SUCCEEDED") {
        finished = true;
        const datasetId = runStatus.data.data.defaultDatasetId;
        const dataset = await axios.get(
          `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`
        );
        result = dataset.data;

        // Save to result.json
        fs.writeFileSync("result.json", JSON.stringify(result, null, 2), "utf8");
        console.log("Data saved to result.json");
        console.table(result);

      } else if (status === "FAILED") {
        finished = true;
        console.error("Actor failed");
      } else {
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  } catch (error) {
    console.error(error);
  }
};

// Run scraping immediately when node index.js is executed
scrapeTikTok();
