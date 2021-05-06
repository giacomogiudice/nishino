import fetch from "node-fetch";
import cheerio from "cheerio";

const ARXIV_URL = "http://export.arxiv.org";
const RESULT_LIMIT = 2000;

const ARXIV_CATEGORIES = ["astro-ph", "cond-mat", "physics"]

export const getPapersByIdArray = async (arr) => {
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
  const data = $("entry").map((ind, elem) => {
    const id = arr[ind];
    const published = $(elem).children("published").text();
    const year = (new Date(published)).getFullYear();
    const title = $(elem).children("title").text();
    const authors = $(elem).children("author").map((_, author) => (
      $(author).children("name").text()
    )).get();
    const summary = $(elem).children("summary").text().trim().replace(/[\n\r]/g, " ");
    const categories = $(elem).children("category").map((_, cat) => $(cat).attr("term")).get();
    const url = $(elem).children("id").text();
    const pdf = $(elem).children("link[title=pdf]").attr("href");
    const journal_ref = $(elem).children("arxiv\\:journal_ref").text();
    const doi = $(elem).children("arxiv\\:doi").text();
    
    return {
      id,
      year,
      published,
      title,
      authors,
      summary,
      categories,
      url,
      pdf,
      journal_ref,
      doi
    }
  }).get();

  return { data };
};
