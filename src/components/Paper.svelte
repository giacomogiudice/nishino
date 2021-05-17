<script>
  import Latex from "./Latex.svelte";

  export let id, title, authors, published, summary, url, pdf, categories, doi, journal_ref;
</script>

<details class="container">
  <summary>
    <p class="title"><Latex text={title} /></p>
    <p class="authors">{authors.join(", ")}</p>
    <p class="info">
      <a href={url}>{id}</a> | {new Date(published).toDateString()} | {categories.join(" ")} |
      <a href={pdf}>PDF</a>
    </p>
  </summary>
  <p class="summary"><Latex text={summary} /></p>
  {#if journal_ref}
    <p class="info">
      Published in <a href={`http://dx.doi.org/${doi}`}>{journal_ref}</a>
    </p>
  {/if}
</details>

<style type="scss">
  @import "../style/variables.scss";
  @import "../style/layout.scss";

  details {
    padding: $spacing--md $spacing--md;
    border-bottom: 1px solid $color--background-highlight;

    &:hover,
    &:active,
    &:focus,
    &:focus-visible {
      cursor: pointer;
      background-color: $color--background-darker;
      border-radius: $border-radius--sm;
    }

    summary {
      list-style: none;
      &::marker,
      &::-webkit-details-marker {
        display: none;
      }
    }
  }

  .title {
    @include text--lg;
  }

  .authors {
    color: $color--secondary;
  }

  .info {
    @include text--sm;
    color: $color--text-lighter;
  }

  .summary {
    padding: $spacing--sm;
  }

  .katex {
    font-size: 1.05em !important;
  }
</style>
