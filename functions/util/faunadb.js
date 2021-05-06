import fetch from "node-fetch";
import cheerio from "cheerio";
import { chunk } from "../../lib/array";

const GET_PAPERS_BY_YEAR = `
  query($year: Int!, $size: Int = 50, $cursor: String) {
    papersByYear(year: $year, _size: $size, _cursor: $cursor) {
      data {
        id
        year
        published
        title
        authors
        summary
        categories
        url
        pdf
        journal_ref
        doi
      }
    }
  }
`;

export const getPapersByYear = async (data) => {
  const output = await query(GET_PAPERS_BY_YEAR, data);
  return validate(output, "papersByYear");
}

const MISSING_IDS_FROM_ARRAY = `
  query ($arr: [String]) {
    missingIdsFromArray(ids: $arr)
  }
`;

const MISSING_IDS_BATCH_SIZE = 128;

export const getMissingIdsFromArray = async (ids) => {
  const promises = chunk(ids, MISSING_IDS_BATCH_SIZE)
    .map((batch) => query(MISSING_IDS_FROM_ARRAY, { arr: batch })
  );
  
  const results = await Promise.all(promises);
  return results.map(
    (output) => validate(output, "missingIdsFromArray")
  ).flat(1);
};

const CREATE_PAPER = `
  mutation($data: PaperInput!) {
    createPaper(data: $data) {
      id
    }
  }
`;

export const createPaper = async (data) => {
  console.log(data);
  const output =  await query(CREATE_PAPER, { data });
  return validate(output, "createPaper");
};

const CREATE_PAPERS_FROM_ARRAY = `
  mutation($arr: [PaperInput]) {
    createPapersFromArray(data: $arr)
  }
`;

const CREATE_PAPERS_BATCH_SIZE = 256

export const createPapersFromArray = async (arr) => {
  const promises = chunk(arr, CREATE_PAPERS_BATCH_SIZE)
    .map((batch) => query(CREATE_PAPERS_FROM_ARRAY, { arr: batch })
  );
  // Possible bug in FaunaDB: Playground returns data, but here it returns a status
  const fulfilled = output => "status" in output && output.status === "fulfilled";
  return (await Promise.allSettled(promises)).every(fulfilled);
};

const FAUNADB_URL = "https://graphql.fauna.com/graphql";

export const query = async (_query, _variables) => {
  const response = await fetch(FAUNADB_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FAUNADB_SERVER_SECRET}`
    },
    body: JSON.stringify({
      query: _query,
      variables: _variables
    }),
  });

  if (!response || !response.ok) {
    throw new Error(`Bad response from ${FAUNADB_URL}\n ${JSON.stringify(response, null, 2)}`);
  }

  return await response.json();
};

const validate = (output, name) => {
  const { data, errors } = output;
  if (errors) {
    throw new Error(`GraphQL failed with the following message\n ${JSON.stringify(errors, null, 2)}`);
  } else if(!data || !(name in data)) {
    throw new Error(`GraphQL data does not contain expected field\n ${JSON.stringify(output, null, 2)}`);
  } else {
    return data[name];
  }
};
