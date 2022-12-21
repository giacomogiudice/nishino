import path from "path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import preprocess from "svelte-preprocess";
import posthtml from "./plugins/vite-plugin-posthtml";
import include from "posthtml-include";
import autoprefixer from "autoprefixer";

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
      preprocess: preprocess({
        postcss: {
          plugins: [autoprefixer()]
        }
      }),
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
    port: 5173,
    proxy: {
      "/api/query": {
        target: "http://localhost:5173/",
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
