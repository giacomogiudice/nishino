# Nishino

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
    Filter(
      Var("array"),
      Lambda("elem", IsEmpty(Match(Index("paperById"), Var("elem"))))
    )
  )
)
```

In order to get papers of a certain year ordered by publication date, we define a new index
```js
CreateIndex({
  name: "papersByYearAndPublished",
  source: Collection("Paper"),
  terms: { field: ["data", "year"] },
  values: [
    { field: ["data", "published"], reverse: true },
    { field: ["ref"]}
  ]
})
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
)
```

Finally, to create a batch of `Paper`s, we define a function called `createPapersFromArray`
```js
Query(
  Lambda(
    ["array"],
    Do(
      Map(
        Var("array"),
        Lambda("elem", Do(Create(Collection("Paper"), { data: Var("elem") })))
      ),
      true
    )
  )
)
```
