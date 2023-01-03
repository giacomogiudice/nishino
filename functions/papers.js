import { client, parser, papers } from "./util/query.js";

export const handler = async (event) => {
  const currentYear = new Date().getFullYear();
  const params = parser(event.queryStringParameters, {
    year: currentYear,
    validate: false,
    refresh: false
  });

  // Open connection to database
  client.isOpen || (await client.connect());

  // Get data
  try {
    const data = await papers(params);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data, null, 2)
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: "Sorry, an error occured."
    };
  } finally {
    // Close connection to database
    process.env.LAMBDA_TASK_ROOT || (await client.disconnect());
  }
};
