const faunadb = require("./util/faunadb");
const quattro = require("./util/quattro");
const arxiv = require("./util/arxiv");
const { unique, difference } = require("../util/array");


const query = async (options) => {
  const firstYear = 1994;
  const currentYear = new Date().getFullYear();

  let {year = currentYear, validate = "latest"} = options;

  if (year < firstYear || year > currentYear) {
    throw new Error("Requested year is not available.")
  }

  let stored, remote;
  // validate accepts 3 modes: "always", "latest", "never"
  if ((validate === "latest") ? (year === currentYear) : (validate === "always")) {
    console.log(`Validating database for year ${year}`);
    // Check timestamps
    const promises = [
      quattro.getPageDataByYear(year),
      faunadb.getPapersByYear({year: year})
    ];

    [remote, stored] = await Promise.all(promises);

    // Compare remote ids to stored ones
    const diff = difference(remote.data, stored.data.map(paper => paper.id));

    // Some papers might be mislabelled, check in database
    const ids = (diff.length) ? await faunadb.getMissingIdsFromArray(diff.filter(unique)) : [];
    console.log(`Database is missing ${ids.length} papers for year ${year}.`);
    if (!ids.length) return stored;
    
    // Fetch data for the missing papers from the arXiv
    const {data: missing} = await arxiv.getPapersByIdArray(ids);
    console.log(`Retrieved information for ${missing.length} new papers for year ${year}.`);

    // Add them to the database
    const response = await faunadb.createPapersFromArray(missing);
    console.log(`Added ${response.length} entries to database for year ${year}.`);

    stored.data = [...stored.data,...missing];
  } else {
    stored = await faunadb.getPapersByYear({year: year});
  }

  return stored;
};

module.exports = { query };
