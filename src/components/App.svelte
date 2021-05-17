<script>
  import { onMount } from "svelte";
  import VirtualList from "./VirtualList.svelte";
  import SearchBar from "./SearchBar.svelte";
  import Paper from "./Paper.svelte";
  import { range } from "$lib/array";

  const firstYear = 1994;
  const lastYear = new Date().getFullYear();

  const itemize = (n) => ({ value: n, label: n.toString() });
  const items = range(firstYear, lastYear).reverse().map(itemize);

  // Page state variables
  let year = undefined;
  let papers = [];

  // Navbar state
  let nav,
    tucked = false;
  let scrollTop = 0;

  $: document.title = `${year} | DMRG Preprints`;
  let loading = true;

  const init = () => {
    // Check if url is of the form /year/:year
    const url = new URL(document.location);
    const match = url.pathname.match(/\/year\/(\d+)/);
    year = match ? parseInt(match[1]) : lastYear;
    // TODO 404
    update();
  };

  const update = async () => {
    console.log("request");
    // We use state variables to not have to tick()
    // Call API
    loading = true;
    let url = `/api/query?year=${year}&size=2000`;
    if (year === lastYear) url += `&validate=true`;

    const res = await fetch(url);

    if (!res.ok) {
      loading = false;
      throw new Error(`Could not load ${url}`);
    }

    const { data } = await res.json();
    papers = data;
    loading = false;
    // Commit new state to history API
    history.replaceState({ year, papers }, null, `/year/${year}`);
  };

  const handlePop = (event) => {
    if (event.state) {
      // Recycle the saved state
      ({ year, papers } = event.state);
    } else {
      // Current location.href is already correct
      init();
    }
    return false;
  };

  const handleSelect = (event) => {
    if (!event || !event.detail || !event.detail.value) {
      console.warn("Unexpected event in handleSelect");
      return;
    }
    // Skip if same year is selected
    if (event.detail.value === year) return;
    // Reset state
    year = event.detail.value;
    papers = [];
    // "Move" to a new page
    history.pushState({ year, papers }, null, `/year/${year}`);
    update().then();
  };

  const handleScroll = (event) => {
    const newScrollTop = event.detail.scrollTop;
    const delta = 30; // Minimum change to listen to
    if (Math.abs(newScrollTop - scrollTop) < delta) return;
    if (newScrollTop > scrollTop) {
      // Scroll down event
      tucked = true;
    } else if (tucked) {
      // Scroll up event
      tucked = false;
    }
    scrollTop = newScrollTop;
  };

  onMount(init);
</script>

<svelte:window on:popstate={handlePop} />

<nav class="container" bind:this={nav} class:tucked style="--height: {nav?.offsetHeight}px">
  <SearchBar {items} on:select={handleSelect} placeholder="Year" text={year} />
  <a role="button" href="/about/">About</a>
</nav>
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

  nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    transition: all 300ms ease-in-out;
    border-bottom: 1px solid $color--background-highlight;

    &.tucked {
      margin-top: calc(-1 * var(--height, 0));
    }
  }

  .announcer {
    margin-top: $spacing--lg;
    margin-bottom: $spacing--lg;
    min-height: $spacing--xxl;
    min-width: 16ch;
  }
</style>
