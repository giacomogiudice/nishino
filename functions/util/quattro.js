import fetch from "node-fetch";
import cheerio from "cheerio";

const QUATTRO_URL = "http://quattro.phys.sci.kobe-u.ac.jp";

const resolveUrl = (year) => {
  const currentYear = new Date().getFullYear();
  const suffix = isNaN(year) || year >= currentYear ? "" : year.toString().substr(-2);

  return `${QUATTRO_URL}/dmrg/condmat${suffix}.html`;
};

export const getPageDataByYear = async (year) => {
  const firstYear = 1994;
  const currentYear = new Date().getFullYear();
  if (year < firstYear || year > currentYear) {
    console.warn(`Requested year ${year} is not available from ${QUATTRO_URL}`);
    return { timestamp: null, data: [] };
  }
  const url = resolveUrl(year);

  // Fetch text
  const response = await fetch(url);

  if (!response || !response.ok) {
    throw new Error(`Bad response from ${url}\n ${JSON.stringify(response, null, 2)}`);
  }
  // Save timestamp
  const timestamp = new Date(response.headers.get("last-modified"));

  // Scrape links from page text
  const body = await response.text();
  const $ = cheerio.load(body);
  const data = $("a")
    .map((_, elem) => {
      const attr = $(elem).attr("href");
      const href = new URL(attr, QUATTRO_URL);
      return href.hostname == "arxiv.org" ? href.pathname.replace("/abs/", "") : null;
    })
    .get();

  return { timestamp, data };
};
