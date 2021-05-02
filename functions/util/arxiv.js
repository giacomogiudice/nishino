const fetch = require("node-fetch");
const cheerio = require("cheerio");

const ARXIV_URL = "http://export.arxiv.org";
const RESULT_LIMIT = 2000;

const getPapersByIdArray = async (arr) => {

  const url = `${ARXIV_URL}/api/query?id_list=${arr.join(",")}&max_results=${RESULT_LIMIT}`;
  
  if (arr.length > RESULT_LIMIT) {
    console.warn(`List of IDs exceeds RESULT_LIMIT=${RESULT_LIMIT}, try increasing it.`);
  }
  
  // Do API request
  const response = await fetch(url);
  if (!response || !response.ok) {
    throw new Error(`Bad response from ${pageUrl}\n ${JSON.stringify(response, null, 2)}`);
  }

  // Extract meaningful tags
  const body = await response.text();
  const $ = cheerio.load(body, { xmlMode: true });
  const papers = $("entry").map((ind, elem) => {
    const published = $(elem).children("published").text();
    const year = (new Date(published)).getFullYear();
    const title = $(elem).children("title").text();
    const authors = $(elem).children("author").map(
      (_, author) => $(author).children("name").text()
    ).get();
    const summary = $(elem).children("summary").text();
    const url = $(elem).children("id").text();
    const pdf = $(elem).children("link[title=pdf]").attr("href");
    return {
      id: arr[ind],
      year: year,
      published: published,
      title: title,
      authors: authors,
      summary: summary,
      url: url,
      pdf: pdf
    }
  }).get();

  return { data: papers };
};

module.exports = { getPapersByIdArray };
