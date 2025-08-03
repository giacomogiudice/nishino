<script>
  import Latex from './Latex.svelte';

  export let id, title, authors, published, summary, url, pdf, categories, doi, journal_ref;
</script>

<details class="container">
  <summary>
    <section>
      <p class="title"><Latex text={title} /></p>
      <p class="authors">{authors.join(', ')}</p>
      <p class="info">
        <a href={url}>{id}</a> | {new Date(published).toDateString()} | {categories.join(' ')} |
        <a href={pdf}>PDF</a>
      </p>
    </section>
  </summary>
  <section>
    <p class="summary"><Latex text={summary} /></p>
    {#if journal_ref}
      <p class="info">
        Published in <a href={`http://dx.doi.org/${doi}`}>{journal_ref}</a>
      </p>
    {/if}
  </section>
</details>

<style lang="scss">
  @use '../style/variables.scss' as *;

  details {
    border-bottom: 1px solid $color--background-highlight;

    summary {
      cursor: pointer;
      list-style: none;

      &:hover,
      &:focus {
        background-color: $color--background-darker;
        outline: 0;
      }

      &::marker,
      &::-webkit-details-marker {
        display: none;
      }
    }
  }

  section {
    padding: $spacing--md;
  }

  .title {
    font-size: $font-size--lg;
  }

  .authors {
    color: $color--secondary;
  }

  .info {
    font-size: $font-size--sm;
    color: $color--text-lighter;
  }

  .summary {
    padding: $spacing--sm;
  }

  .katex {
    font-size: 1.05em !important;
  }
</style>
