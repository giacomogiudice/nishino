import { client, ids } from "./queries.js";
import { range } from "../../lib/array.js";

export const setup = async () => {
  // Open connection to database
  await client.connect();

  // Populate database for all years
  const firstYear = 1994;
  const lastYear = new Date().getFullYear();

  for (let year of range(firstYear, lastYear)) {
    console.log("Generating data for year", year);
    const data = await ids({ year: year, update: true, refresh: true });
    if (!data.length) {
      throw new Error(`No papers for year ${year}`);
    }
    console.log("");
  }

  // Close connection to database
  await client.disconnect();
};

setup().then(() => console.log("Done 🎉"));
