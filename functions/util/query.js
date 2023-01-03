import { createClient } from "redis";
import * as quattro from "./quattro.js";
import * as arxiv from "./arxiv.js";
import { unique, difference, union } from "../../lib/array.js";

export const client = createClient({
  url: process.env.REDIS_URL
});

export const parser = (input, defaults) => {
  const output = input;
  for (let key in defaults) {
    if (key in output) {
      switch (typeof defaults[key]) {
        case "string":
          output[key] = String(output[key]);
          break;
        case "number":
          output[key] = Number(output[key]);
          break;
        case "boolean":
          output[key] = output[key] === "true" || output[key] == true;
          break;
      }
    } else {
      output[key] = defaults[key];
    }
  }
  return output;
};

export const ids = async (options) => {
  const { year, validate, refresh } = options;
  let tic, toc;

  // Fetch papers
  tic = Date.now();
  let storedIds = await client.zRangeByScore("index", year, year);
  toc = Date.now();
  console.log(`Retrieved stored ids in ${toc - tic} ms,`, storedIds.length, "papers");

  let remoteIds = [];
  let missingIds = [];
  if (validate) {
    // Fetch paper IDs from source
    tic = Date.now();
    //TODO rename remoteIds, storedIds
    const remote = await quattro.getPageDataByYear(year);
    remoteIds = remote.data.filter(unique);
    toc = Date.now();
    console.log(`Scraped source in ${toc - tic} ms,`, remoteIds.length, "papers");
  }

  if (refresh) {
    missingIds = union(remoteIds, storedIds);
  } else {
    missingIds = difference(remoteIds, storedIds);
  }

  if (validate && !refresh && missingIds.length) {
    // Some papers might be mislabelled, check in database if they alrady exist
    tic = Date.now();
    const pipeline = client.multi();
    missingIds.forEach((id) => pipeline.exists(id));
    const mask = await pipeline.exec();
    console.log("mask", mask);
    missingIds = missingIds.filter((item, i) => !mask[i]);
    toc = Date.now();
    console.log(`Filtered missing papers  in ${toc - tic} ms,`, missingIds.length, "papers");
  }

  if (missingIds.length) {
    // Fetch data for the missing papers from the arXiv
    tic = Date.now();
    const { data: missing } = await arxiv.getPapersByIdArray(missingIds);
    toc = Date.now();
    console.log(`Retrieved data in ${toc - tic} ms,`, missing.length, "papers");

    // Add them to the database
    tic = Date.now();
    const pipeline = client.multi();
    missing.forEach((paper) => pipeline.json.set(paper.id, "$", paper));
    const added = await pipeline.exec();

    const indexed = await client.zAdd(
      "index",
      missing.map((paper) => {
        return { score: paper.year, value: paper.id };
      })
    );
    const complete = added.every((res) => res === "OK") && typeof indexed === "number";
    toc = Date.now();
    console.log(`Updated database in ${toc - tic} ms,`, "complete:", complete);

    if (validate && !refresh) {
      storedIds.push(...missingIds);
    }
  }

  return storedIds;
};

export const papers = async (options) => {
  let tic, toc;

  // Use `ids` to fetch paper IDs
  const storedIds = await ids(options);

  // Get data for those papers
  tic = Date.now();
  const pipeline = client.multi();
  storedIds.forEach((id) => pipeline.json.get(id));
  const stored = await pipeline.exec();
  toc = Date.now();
  console.log(`Retrieved paper data in ${toc - tic} ms,`, stored.length, "papers");

  return stored;
};
