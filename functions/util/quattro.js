const url = require("url");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const QUATTRO_URL = "http://quattro.phys.sci.kobe-u.ac.jp";

const resolveUrl = (year) => {
  const currentYear = new Date().getFullYear();
  const suffix = (isNaN(year) || year >= currentYear) ? "" : year.toString().substr(-2);

  return `${QUATTRO_URL}/dmrg/condmat${suffix}.html`;
};

const getPageDataByYear = async (year) => {
  const pageUrl = resolveUrl(year);

  // Fetch text
  const response = await fetch(pageUrl);
  
  if (!response || !response.ok) {
    throw new Error(`Bad response from ${pageUrl}\n ${JSON.stringify(response, null, 2)}`);
  }
  // Save timestamp
  const timestamp = new Date(response.headers.get("last-modified"));

  // Scrape links from page text
  const body = await response.text();
  const $ = cheerio.load(body);
  const ids = $("a").map((_, elem) => {
    const attr = $(elem).attr("href");
    const href = new URL(attr, QUATTRO_URL);
    return (href.hostname == "arxiv.org") ? href.pathname.replace("/abs/","") : null;
  }).get();

  return {timestamp: timestamp, data: ids};
};

module.exports = { getPageDataByYear };
