<script>
  import Fuse from 'fuse.js';
  import { range } from '$lib/array';
  import VirtualList from './VirtualList.svelte';
  import SearchBar from './SearchBar.svelte';
  import Paper from './Paper.svelte';
  import Pinned from './Pinned.svelte';

  const firstYear = 1994;
  const lastYear = new Date().getFullYear();

  const itemize = (n) => ({ value: n, label: n.toString() });
  const items = range(firstYear, lastYear).reverse().map(itemize);

  // Page state variables
  export let year = undefined;
  export let papers = [];

  // Loading state
  export let loading = true;

  // Filtering functionality
  let text = '';

  $: fuse = new Fuse(papers, {
    keys: ['id', 'title', 'authors', 'categories'],
    shouldSort: true,
    threshold: 0.3,
    ignoreLocation: true
  });

  // Compares papers by `published` field
  const byPublished = (a, b) => {
    return b['published'] > a['published'] ? 1 : -1;
  };

  $: filteredPapers =
    text == '' ? papers.sort(byPublished) : fuse.search(text).map((obj) => obj['item']);
</script>

<Pinned let:hidden offset={10}>
  <nav class:hidden>
    <div class="container">
      <SearchBar {items} on:select placeholder="Year" text={year} />
      <filter-bar>
        <input type="text" class="filter" bind:value={text} placeholder="Search" />
      </filter-bar>
      <a role="button" href="/about/">About</a>
    </div>
  </nav>
</Pinned>
{#if loading}
  <div class="container announcer flex-even">
    <object type="image/svg+xml" data="/loading.svg" name="loading" aria-label="loading"></object>
  </div>
{:else if filteredPapers.length}
  <VirtualList items={filteredPapers} let:item={paper} threshold={600}>
    <Paper {...paper} />
  </VirtualList>
{:else}
  <div class="container announcer flex-even">
    <h2>No papers available</h2>
  </div>
{/if}
<div class="bottom-gap"></div>

<style lang="scss">
  @use "sass:color";
  @use '../style/variables.scss' as *;

  .bottom-gap {
    margin-bottom: $spacing--xl;
  }

  nav {
    position: sticky;
    top: 0;
    z-index: 1;
    width: 100%;
    background-color: color.adjust($color--background, $alpha: -0.1);
    transition: all $transition-time--md ease-in-out;

    &.hidden {
      transform: translateY(-100%);
    }

    .container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid $color--background-highlight;
    }
  }

  filter-bar {
    width: 32ch;
    margin-left: $spacing--sm;
    margin-right: $spacing--sm;
  }

  .announcer {
    margin-top: $spacing--lg;
    margin-bottom: $spacing--lg;
    min-height: $spacing--xxl;
    min-width: 16ch;
  }
</style>
