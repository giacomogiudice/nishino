import { client, ids } from "./query.js";
import { range } from "../../lib/array.js";

export const setup = async () => {
  // Open connection to database
  await client.connect();

  // Populate database for all years
  const firstYear = 1994;
  const lastYear = new Date().getFullYear();

  for (let year of range(firstYear, lastYear)) {
    console.log("Generating data for year", year);
    const data = await ids({ year: year, validate: true, refresh: true });
    if (!data.length) {
      throw new Error(`No papers for year ${year}`);
    }
    console.log("");
  }

  // Close connection to database
  await client.disconnect();

  console.log("");
  console.log("Done 🎉");
};

setup()
  .then(() => {
    return 0;
  })
  .catch((err) => console.error(err));
