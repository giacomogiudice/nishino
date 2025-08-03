# DMRG Preprints

[![CI][ci-img]][ci-url]
[![Netlify Status][netlify-img]][netlify-url]

[ci-img]: https://github.com/giacomogiudice/nishino/actions/workflows/publish.yml/badge.svg
[ci-url]: https://github.com/giacomogiudice/nishino/actions/workflows/publish.yml
[netlify-img]: https://api.netlify.com/api/v1/badges/8c331476-72ba-4331-9bf5-9800bea0f3b5/deploy-status
[netlify-url]: https://app.netlify.com/sites/nishino/deploys

A small reader for Tomotoshi Nishino's selection of papers on tensor networks.

Check out the [website](https://tensornet.work/).

## Abstract

Papers on tensor networks appear every day, but it is hard to keep track of them, since they span a vast number of [arXiv](http://arxiv.org) categories.
For almost 30 years, professor Tomotoshi Nishino has been keeping track of papers related to tensor networks appearing on arXiv, and posting them on his [website](http://quattro.phys.sci.kobe-u.ac.jp/dmrg/condmat.html).

I wanted to make a simple reader for his website, which would include additional features like the abstract, a direct link to the PDF, and an arguably prettier formatting.
The reader needs to be always up-to-date, as fast as possible, and minimalistic.

## Tech

For a seemingly simple task, there are remarkably many parts that come together.

- 💾 [Redis](https://redis.io/) caching (with RedisJSON)
- 🤖 API using [Netlify functions](https://www.netlify.com/products/functions/)
- 📦 [Vite](https://vitejs.dev/) for bundling and frontend dev environment
- ✏️ HTML templates with [PostHTML](https://github.com/posthtml/)
- 🎲 Interactive components with [Svelte](https://svelte.dev/)
- 🎓 Fast LaTeX rendering with [Katex](https://katex.org/)

The database is used to store all the papers from the original website, so it doesn't have to be queried every time some content is requested.
Each entry in the database corresponds uniquely to a paper, and contains information about the paper such as the title, authors, abstract, etc (see below).

The API hosted on Netlify responds to requests of the form

```
https://tensornet.work/api/ids?
https://tensornet.work/api/papers?

```

with query parameters `year`, `update`, and `refresh`.

If `update` is `true`, the API will request the original website for the specified `year`, extract the `arxiv.org` links, and check if they are present in the database.
If not, it requests the information of the missing papers from the [arXiv API](http://arxiv.org/help/api/), and send them to the database.
Additionally, the `refresh` option updates all existing entries with data from the arXiv API.

The frontend components are written with Svelte.
It seemed to me the best choice, since it aimed at being a lightweight and fast reactive framework.
It's fairly concise but doesn't bring in too much framework bloat.

I wanted all non-interactive components (i.e. HTML partials) to be included at build time, so I'm using the [posthtml-include](https://github.com/posthtml/posthtml-include) plugin.
It could be removed if the project moves to some framework like SvelteKit.

Finally, Vite is an amazing bundler and comes with a great dev server.
It's a bit too opinionated on where the `index.html` files should be, so while a better solution awaits, there is an `about` folder floating around for the `/about/` route.
Unfortunately, it's not static enough to go in the `public` folder.

## Todo

Here is a list of improvements

- ~~Infinite scroll~~.
- ~~Information like the journal ref. and the DOI are not updated.~~
- Add a marker for Prof. Nishino's RGB rating.
- Pre-render certain pages on the server or at build time. As long as the site is not very popular it makes no sense to pre-fetch the content of the landing page, but previous years can be optimized.
- Try SvelteKit. It seems promising since it offers out-of-the-box SSR and integration with Netlify.

## Development Setup

### Frontend

Once you have cloned the package, you first want to install the dependencies with

```bash
npm install
```

To update packages to the latest non-major version, use `npm upgrade --save`.
You can then work on it locally and see the results with

```bash
npm run dev
```

this will start a local server using Vite, which supports fast reloading.
It will not actually connect to the database but will use a mockup.
This is useful for frontend development only.

To build the project, you can use

```bash
npm run build
```

You can find the output in the `dist/` folder.

### Database setup

First create a database on [Redis Labs](https://app.redislabs.com/) or any Redis provider (currently using [Upstash](https://upstash.com/)).
You can also host your own by installing `redis-server` and `redis-cli` or using the [docker image](https://redis.io/docs/stack/get-started/install/docker/).
It must have the **RedisJSON** module available and activated.
Since the Netlify functions are hosted at `us-east-1`, it makes sense to choose somewhere near that as a location.
To develop locally, you can create a `.env` file on the root folder, with the following variable

```
REDIS_URL=redis://<user>:<password>@<hostname>:<port>
```

and add it to the Netlify environment with `netlify env:import .env` or import it manually with `netlify env:set REDIS_URL <value>`.

If you have the tool `redis-cli`, you can interactively log into the database from your terminal

```
source .env
redis-cli -u $REDIS_URL
```

This can be useful, for example to empty the database.

### Backend

To actually run the Lambda functions and test with the real dataset, you need to have the [Netlify CLI](https://docs.netlify.com/cli/get-started/) installed.

```bash
npm install -g netlify-cli
```

Once you have it, you can develop locally with

```bash
netlify dev
```

See also `npm run` and `netlify -h` for more commands.

### GitHub Actions

The deployment of the site happens through a GitHub actions CI.
There are the following action workflows: `publish.yml` publishes the site on each push to master, while `preview.yml` generates a preview build on each PR.
There is also an `update.yml` which runs as a cron job to update the database on a monthly basis.
The secrets `NETLIFY_SITE_ID`, `NETLIFY_AUTH_TOKEN` and `REDIS_URL` need to be uploaded so that the runners have access to them.
