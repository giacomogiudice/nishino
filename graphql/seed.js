const { query } = require("./api");
const { range } = require("../util/array");

(async () => {
  const firstYear = 1994;
  const currentYear = new Date().getFullYear();

  console.log(`Updating database from ${firstYear} to ${currentYear}...`);
  const promises = range(firstYear, currentYear).map(
    year => query({year: year, validate: "always"})
  );

  let tic, toc;
  tic = Date.now();
  await Promise.allSettled(promises).catch(err => console.error(err));
  toc = Date.now();
  
  console.log(`Updated database in ${(toc - tic)/1000} s.`);

})();
