import { decode } from "html-entities";

// Matches accented LaTeX patterns like \'e or \'{e}
const latexCharacters = /\\(\"|\'|\^|\~|c|v|\.|mathbb|H)\{?([A-Za-z])\}?/g;

// Map between the accent and the HTML entity
const entityDict = {
  '"': "uml",
  "`": "grave",
  "'": "acute",
  "^": "circ",
  "~": "tilde",
  "c": "cedil",
  "v": "caron",
  ".": "dot",
  "mathbb": "opf",
  "H": "#779"
};

// Replaces regex match with UTF-8 character
const accent = (_, char, letter) => decode(`&${letter}${entityDict[char]};`);

export const replaceLatexAccents = (str) => str.replace(latexCharacters, accent);
