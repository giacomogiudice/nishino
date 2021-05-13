import path from "path";
import svelte from "@sveltejs/vite-plugin-svelte";
import preprocess from "svelte-preprocess";
import posthtml from "./plugins/vite-plugin-posthtml";
import include from "posthtml-include";

export default {
  publicDir: "static",
  build: {
    rollupOptions: {
      input: ["index.html", "about/index.html"],
    }
  },
  plugins: [
    posthtml({
      plugins: [include()]
    }),
    svelte({
      preprocess: preprocess()
    }),
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
        rewrite: path => "mock/proxy.json"
      }
    }
  }
};
