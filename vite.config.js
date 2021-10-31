import path from "path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import preprocess from "svelte-preprocess";
import posthtml from "./plugins/vite-plugin-posthtml";
import include from "posthtml-include";

export default {
  publicDir: "static",
  build: {
    rollupOptions: {
      input: ["index.html", "about/index.html"]
    }
  },
  plugins: [
    posthtml({
      plugins: [include()]
    }),
    svelte({
      preprocess: preprocess(),
      compilerOptions: {
        cssHash: ({ hash, css, name }) => `${kebabCase(name)}--${hash(css)}`
      },
      onwarn: (warning, handler) => {
        const { code } = warning;
        if (code === "css-unused-selector") return;
        handler(warning);
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve("src"),
      "$lib": path.resolve("lib")
    }
  },
  rollupDedupe: ["svelte"],
  server: {
    proxy: {
      "/api/query": {
        target: "http://localhost:3000/",
        rewrite: () => "mock/proxy.json"
      }
    }
  }
};

const kebabCase = (str) => {
  if (!str) return "";
  const regex = /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g;
  return str
    .match(regex)
    .map((x) => x.toLowerCase())
    .join("-");
};
