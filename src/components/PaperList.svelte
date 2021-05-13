<script>
  import Latex from "./Latex.svelte";
  
  export let papers;
</script>

<ul>
  {#each papers as paper}
    <li>
      <article>
        <p class="title"><Latex text={paper.title}/></p>
        <p class="authors">{paper.authors.join(", ")}</p>
        <p class="info">
          <a href={paper.url}>{paper.id}</a> | {(new Date(paper.published)).toDateString()} | {paper.categories.join(" ")} | <a href={paper.pdf}>PDF</a>
        </p>
        <p class="summary"><Latex text={paper.summary}/></p>
        {#if paper.journal_ref}
          <p class="info">Published in <a href={`http://dx.doi.org/${paper.doi}`}>{paper.journal_ref}</a></p>
        {/if}
      </article>
    </li>
  {/each}
</ul>

<style type="scss">
  @import "../style/variables.scss";

  li {
    padding: $spacing--sm 0;
  }

  li:nth-child(even) {
    background-color: $color--background-darker;
    border-radius: $border-radius--sm;   
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
