# Nishino

## FaunaDB Setup
In order to test the database locally, we use the `netlify dev` command from ![Netlify CLI](https://cli.netlify.com/).
To automagically add the FaunaDB authentication secret, run the following commands
```
netlify addons:create fauna
netlify addons:auth fauna
```

If the database is empty, start by uploading the `schema.gql` file.
Two main types are defined: `Paper` and `Build.`

### Papers
The `Paper` contains information about a single paper.

In order to filter using the `id` of each `Paper`, we define a new index `CreateIndex` from the Shell
```js
CreateIndex({
  name: "allPapersById",
  source: Collection("Paper"),
  values: [{ field: ["data", "id"] }, { field: ["ref"] }]
})
```

Now, to get the missing `id`s from an array of `id`s, we define the function `missingIdsFromArray`
```js
Query(
  Lambda(
    ["array"],
    Filter(
      Var("array"),
      Lambda(
        "elem",
        IsEmpty(
          Filter(
            Match(Index("allPapersById")),
            Lambda(["id", "ref"], Equals(Var("elem"), Var("id")))
          )
        )
      )
    )
  )
)
```
Finally, to create a batch of `Paper`s, we define a User-defined function (UDF) called `createPapersFromArray`
```js
Query(
  Lambda(
    ["array"],
    Map(
      Var("array"),
      Lambda("elem", Do(Create(Collection("Paper"), { data: Var("elem") })))
    )
  )
)
```

### Builds
To keep track of when a database build happened, we use a `Build` entry.
To retrieve them by time, let us define a new index `buildsByTimestamp` using the Shell
```js
CreateIndex({
  name: "buildsByTimestamp",
  source: Collection("Build"),
  values: [{ field: ["ts"], reverse: true }, { field: ["data", "time"] }]
})
```

To create a build without having to give the time, we define a function `createBuild`
```js
Query(Lambda("_", Do(Create(Collection("Build"), { data: { time: Now() } }))))
```

To retrieve the latest timestamp, we define a function `lastBuildTimestamp`
```js
Query(
  Lambda(
    "_",
    Let(
      {
        arr: Select(
          "data",
          Map(
            Paginate(Match(Index("buildsByTimestamp")), {size: 1}),
            Lambda(["tf", "time"], Var("time"))
          )
        )
      },
      If(IsNonEmpty(Var("arr")), Select(0, Var("arr")), null)
    )
  )
)
```

Now timestamps should be easy to create and retrieve.

### Nuke everything
```
Map(
  Paginate(
    Documents(Collection('Paper')),
    { size: 9999 }
  ),
  Lambda(
    ['ref'],
    Delete(Var('ref'))
  )
)
```
