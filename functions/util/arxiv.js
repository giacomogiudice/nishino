import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { chunk } from '../../lib/array.js';
import { replaceLatexAccents } from '../../lib/string.js';

const ARXIV_URL = 'http://export.arxiv.org';

const ARXIV_BATCH_SIZE = 256;

export const getPapersByIds = async (ids) => {
  // Batch the requests
  const promises = chunk(ids, ARXIV_BATCH_SIZE).map(async (batch) => {
    const url = `${ARXIV_URL}/api/query?id_list=${batch.join(',')}&max_results=${ARXIV_BATCH_SIZE}`;

    const response = await fetch(url);
    if (!response || !response.ok) {
      throw new Error(`Bad response from arXiv:\n ${JSON.stringify(response, null, 2)}`);
    }
    const body = await response.text();
    return extractPapers(body, batch);
  });

  const partials = await Promise.all(promises);
  // Flatten partials
  return Array.prototype.concat.apply([], partials);
};

const extractPapers = (body, ids) => {
  const whitespaces = /\s+/g;

  // Extract meaningful tags
  const $ = cheerio.load(body, { xmlMode: true });
  const data = $('entry')
    .map((ind, elem) => {
      const id = ids[ind];
      const published = $(elem).children('published').text();
      const year = new Date(published).getFullYear();
      const title = $(elem).children('title').text().replace(whitespaces, ' ').trim();
      const authors = $(elem)
        .children('author')
        .map((_, author) => $(author).children('name').text())
        .get();
      const summary = replaceLatexAccents(
        $(elem).children('summary').text().replace(whitespaces, ' ').trim()
      );
      const categories = $(elem)
        .children('category')
        .map((_, cat) => $(cat).attr('term'))
        .get();
      const url = $(elem).children('id').text();
      const pdf = $(elem).children('link[title=pdf]').attr('href');
      const journal_ref = $(elem).children('arxiv\\:journal_ref').text();
      const doi = $(elem).children('arxiv\\:doi').text();

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
      };
    })
    .get();

  return data;
};
