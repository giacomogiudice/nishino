const { query } = require("../graphql/api");

exports.handler = async (event, context, callback) => {
  let { year = currentYear, validate = "latest" } = event.queryStringParameters;
  year = parseInt(year);

  const data = await query({year: year, validate: validate}).catch((err) => {
    console.error(err);
    return {
      statusCode: 500,
      body: err
    };
  });

  return {
    statusCode: 200,
    body: JSON.stringify(data, null, 2)
  };
};
