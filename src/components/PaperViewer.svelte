<script>
  import { slide } from "svelte/transition";
  import { range } from "$lib/array";
  import VirtualList from "./VirtualList.svelte";
  import SearchBar from "./SearchBar.svelte";
  import Paper from "./Paper.svelte";
  import Pinned from "./Pinned.svelte";

  const firstYear = 1994;
  const lastYear = new Date().getFullYear();

  const itemize = (n) => ({ value: n, label: n.toString() });
  const items = range(firstYear, lastYear).reverse().map(itemize);

  // Page state variables
  export let year = undefined;
  export let papers = [];

  // Loading state
  export let loading = true;

  // Scroll state
  let y;

  const handleScroll = (event) => {
    y = event.detail.scrollTop;
  };
</script>

<Pinned bind:y let:pinned>
  <!-- Use key to avoid building/destroying DOM elements -->
  {#key pinned}
    <nav class:pinned transition:slide={{ duration: 300 }}>
      <SearchBar {items} on:select placeholder="Year" text={year} />
      <a role="button" href="/about/">About</a>
    </nav>
  {/key}
</Pinned>

{#if loading}
  <div class="container announcer flex-even">
    <object type="image/svg+xml" data="/loading.svg" name="loading" aria-label="loading" />
  </div>
{:else if papers.length}
  <VirtualList items={papers} let:item={paper} on:scroll={handleScroll}>
    <Paper {...paper} />
  </VirtualList>
{:else}
  <div class="container announcer flex-even">
    <h2>No papers available</h2>
  </div>
{/if}

<style type="scss">
  @import "../style/variables.scss";

  :global(virtual-list-viewport) {
    padding-top: $spacing--xl;
  }

  nav {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    max-width: $width--container;
    position: absolute;
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
    z-index: 1;
    background-color: $color--background;
    border-bottom: 1px solid $color--background-highlight;

    &:not(.pinned) {
      display: none;
    }
  }

  .announcer {
    margin-top: $spacing--lg;
    margin-bottom: $spacing--lg;
    min-height: $spacing--xxl;
    min-width: 16ch;
  }
</style>
