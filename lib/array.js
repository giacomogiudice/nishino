
// Filter unique elements in array
// Usage:
//  arr = [1,2,1,2,3,4];
//  arr.filter(unique);
const unique = (value, index, self) => (
  self.indexOf(value) === index
);

// Split array into chunks of size 'n'
const chunk = (arr, n) => (
  Array.from(Array(Math.ceil(arr.length/n)), (_,i) => arr.slice(i*n, i*n+n))
);

// Create array from 'from' to 'to' with step 'step'
const range = (from, to, step = 1) => (
  [...Array(Math.floor((to - from)/step) + 1)].map((_, i) => from + i * step)
);
// Set difference
// Usage:
//  a = [1,2,3], b = [1,2]
//  difference(a, b)
const difference = (a, b) => a.filter(x => !b.includes(x));

export { unique, chunk, range, difference }
