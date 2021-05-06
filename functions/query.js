import * as faunadb from "./util/faunadb";
import * as quattro from "./util/quattro";
import * as arxiv from "./util/arxiv";
import { unique, difference } from "../lib/array";

export const query = async (options) => {
  const firstYear = 1994;
  const currentYear = new Date().getFullYear();

  let {year = currentYear, validate = true} = options;

  if (year < firstYear || year > currentYear) throw new Error("Requested year is not available.")

  let stored, remote;
  let tic, toc;
  
  if (validate) {
    console.log(`Validating database for year ${year}`);
    
    tic = Date.now();
    const promises = [
      quattro.getPageDataByYear(year),
      faunadb.getPapersByYear({year: year})
    ];
    [remote, stored] = await Promise.all(promises);

    // Compare remote ids to stored ones
    const diff = difference(remote.data, stored.data.map(paper => paper.id));

    // Some papers might be mislabelled, check in database
    const ids = (diff.length) ? await faunadb.getMissingIdsFromArray(diff.filter(unique)) : [];
    toc = Date.now();
    console.log(`${ids.length} missing IDs for year ${year} confirmed in ${toc - tic} ms.`);
    if (!ids.length) return stored;
    
    // Fetch data for the missing papers from the arXiv
    tic = Date.now();
    const {data: missing} = await arxiv.getPapersByIdArray(ids);
    toc = Date.now();
    console.log(`Retrieved information for ${missing.length} new papers for year ${year} in ${toc - tic} ms.`);

    // Add them to the database
    tic = Date.now();
    const complete = await faunadb.createPapersFromArray(missing);
    toc = Date.now();
    complete && console.log(`Entries for year ${year} added to database in ${toc - tic} ms.`);

    stored.data = [...stored.data,...missing];
  } else {
    stored = await faunadb.getPapersByYear({ year });
  }

  return stored;
};

export const handler = async (event, context, callback) => {
  let { year = "", validate = "false" } = event.queryStringParameters;
  year = (year) ? parseInt(year) : undefined;
  validate = (validate === "true");

  const data = await query({ year, validate }).catch((err) => {
    console.error(err);
    return {
      statusCode: 500,
      body: err
    };
  });

  return {
    statusCode: 200,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data, null, 2)
  };
};

export default query;
