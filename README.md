# DMRG Preprints

[![CI][ci-img]][ci-url]
[![Netlify Status][netlify-img]][netlify-url]

[ci-img]: https://github.com/giacomogiudice/nishino/actions/workflows/publish.yaml/badge.svg
[ci-url]: https://github.com/giacomogiudice/nishino/actions/workflows/publish.yaml
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

- 💾 [FaunaDB](https://fauna.com/) database
- 🤖 API using [Netlify functions](https://www.netlify.com/products/functions/)
- 📦 [Vite](https://vitejs.dev/) for bundling and frontend dev environment
- ✏️ HTML templates with [PostHTML](https://github.com/posthtml/)
- 🎲 Interactive components with [Svelte](https://svelte.dev/)
- 🎓 Fast LaTeX rendering with [Katex](https://katex.org/)

The database is used to store all the papers from the original website, so it doesn't have to be queried every time some content is requested.
Each entry in the database corresponds uniquely to a paper, and contains information about the paper such as the title, authors, abstract, etc (see below).

The API hosted on Netlify responds to requests of the form

```
https://tensornet.work/api/query?
```

with query parameters `year`, `validate`, `size` and `cursor`.

If `validate` is `true`, the API will request the original website for the specified `year`, extract the `arxiv.org` links, and check if they are present in the database.
If not, it requests the information of the missing papers from the [arXiv API](http://arxiv.org/help/api/), and send them to the database.
The parameters `size` and `cursor` are used for pagination.

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
- Add a marker for Prof. Nishino's RGB rating.
- Pre-render certain pages on the server or at build time. As long as the site is not very popular it makes no sense to pre-fetch the content of the landing page, but previous years can be optimized.
- Try SvelteKit. It seems promising since it offers out-of-the-box SSR and integration with Netlify.
- Information like the journal ref. and the DOI are not updated.

## Development Setup

Once you have cloned the package, you can work on it locally and see the results with

```bash
npm run dev
```

this will start a local server using Vite, which supports fast reloading.
It will not actually connect to the database but will use a mockup.

To build the project, you can use

```bash
npm run build
```

You can find the output in the `dist/` folder.

To actually test with the real dataset, you need to have the [Netlify CLI](https://docs.netlify.com/cli/get-started/) installed.
Once you have it and have linked it to the database, you can develop locally with

```bash
netlify dev
```

See also `npm run` and `netlify -h` for more commands.

## FaunaDB Setup

In order to test the database locally, we use the `netlify dev` command from ![Netlify CLI](https://cli.netlify.com/).
To automagically add a FaunaDB database to the repository, run the following commands

```bash
netlify link
netlify addons:create fauna
netlify addons:auth fauna
```

Next head over to https://dashboard.fauna.com and start by uploading the `schema.gql` file.
There is a single `Paper` type defined, which contains information about a single paper.
Now we need to define some custom function attached to the GraphQL queries.

To get the missing `id`s from an array of `id`s, we define the function `missingIdsFromArray`

```js
Query(
  Lambda(
    ["array"],
    Filter(Var("array"), Lambda("elem", IsEmpty(Match(Index("paperById"), Var("elem")))))
  )
);
```

In order to get papers of a certain year ordered by publication date, we define a new index

```js
CreateIndex({
  name: "papersByYearAndPublished",
  source: Collection("Paper"),
  terms: { field: ["data", "year"] },
  values: [{ field: ["data", "published"], reverse: true }, { field: ["ref"] }]
});
```

and a new function `papersByYear`, which paginates the papers of each year from the most recent to oldest one.

```js
Query(
  Lambda(
    ["year", "size", "after", "before"],
    Let(
      {
        match: Match(Index("papersByYearAndPublished"), Var("year")),
        page: If(
          IsNull(Var("before")),
          If(
            IsNull(Var("after")),
            Paginate(Var("match"), { size: Var("size") }),
            Paginate(Var("match"), { after: Var("after"), size: Var("size") })
          ),
          Paginate(Var("match"), { before: Var("before"), size: Var("size") })
        )
      },
      Map(Var("page"), Lambda(["date", "ref"], Get(Var("ref"))))
    )
  )
);
```

Finally, to create a batch of `Paper`s, we define a function called `createPapersFromArray`

```js
Query(
  Lambda(
    ["array"],
    Do(
      Map(Var("array"), Lambda("elem", Do(Create(Collection("Paper"), { data: Var("elem") })))),
      true
    )
  )
);
```

Optionally, we may want to create a function to delete the stored `Papers`.

```js
Query(
  Lambda(
    "_",
    Map(
      Paginate(Documents(Collection("Paper")), { size: 9999 }),
      Lambda(["ref"], Delete(Var("ref")))
    )
  )
);
```

which we can call from the shell as `Call(Function("reset"))`.
Notice that you amy need to call it a couple times if you have 10000 entries or more.
