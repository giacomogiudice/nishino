import * as faunadb from "./util/faunadb";
import * as quattro from "./util/quattro";
import * as arxiv from "./util/arxiv";
import { unique, difference } from "../lib/array";

const parser = (input, defaults) => {
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
          output[key] = output[key] === "true";
          break;
      }
    } else {
      output[key] = defaults[key];
    }
  }
  return output;
};

export const query = async (options) => {
  const currentYear = new Date().getFullYear();
  const { year, validate, size, cursor } = parser(options, {
    year: currentYear,
    validate: false,
    size: 10
  });

  let stored, remote;
  let tic, toc;

  if (validate) {
    console.log(`Validating database for year ${year}`);

    tic = Date.now();
    const promises = [
      quattro.getPageDataByYear(year),
      faunadb.getPapersByYear({ year, validate, size, cursor })
    ];
    [remote, stored] = await Promise.all(promises);

    // Compare remote ids to stored ones
    const diff = difference(
      remote.data,
      stored.data.map((paper) => paper.id)
    );

    // Some papers might be mislabelled, check in database
    const ids = diff.length ? await faunadb.getMissingIdsFromArray(diff.filter(unique)) : [];
    toc = Date.now();
    console.log(`${ids.length} missing IDs for year ${year} confirmed in ${toc - tic} ms.`);
    if (!ids.length) return stored;

    // Fetch data for the missing papers from the arXiv
    tic = Date.now();
    const { data: missing } = await arxiv.getPapersByIdArray(ids);
    toc = Date.now();
    console.log(
      `Retrieved information for ${missing.length} new papers for year ${year} in ${toc - tic} ms.`
    );

    // Add them to the database
    tic = Date.now();
    const complete = await faunadb.createPapersFromArray(missing);
    toc = Date.now();
    complete && console.log(`Entries for year ${year} added to database in ${toc - tic} ms.`);

    stored.data = [...stored.data, ...missing];
  } else {
    stored = await faunadb.getPapersByYear({ year, validate, size, cursor });
  }

  return stored;
};

export const handler = async (event) => {
  let params = event.queryStringParameters;

  const data = await query(params).catch((err) => {
    console.error(err);
    return {
      statusCode: 500,
      body: err
    };
  });

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data, null, 2)
  };
};

export default query;
