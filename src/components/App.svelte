<script>
  import { onMount } from "svelte";
  import PaperList from "./PaperList.svelte";
  import SearchBar from "./SearchBar.svelte";
  import { range } from "$lib/array";

  const firstYear = 1994;
  const lastYear = new Date().getFullYear();

  const itemize = n => ({ value: n, label: n.toString() });
  const items = range(firstYear, lastYear).reverse().map(itemize);

  const reset = (_year) => ({
    year: _year,
    papers: [],
    cursor: undefined,
    bottomed: false
  });

  // The source of truth (could potentially be a store)
  let state = reset();

  // Dependent variables
  $: ({year, papers, cursor, bottomed} = state);
  $: document.title = `${year} | DMRG Preprints`;
  let loading = true;

  const init = () => {  
    // Check if url is of the form /year/:year  
    const url = new URL(document.location);
    const match = url.pathname.match(/\/year\/(\d+)/);
    const _year = (match)? parseInt(match[1]) : lastYear;
    // TODO 404
    state = reset(_year);
    update().then();
  };

  const update = async () => {
    // We use state variables to not have to tick()
    if (state.bottomed) return;
    // Call API 
    loading = true;
    let url = `/api/query?year=${state.year}`;
    if (state.year === lastYear) url += `&validate=true`;
    if (state.cursor) url += `&cursor=${state.cursor}`;
    const res = await fetch(url);
    loading = false;
    
    if (!res.ok) {
      throw new Error(`Could not load ${url}`);
    }
    const { data, after } = await res.json();
    state.papers = data;
    state.cursor = after;
    // Set bottomed flag to true if we reached the end
    if (!state.cursor && state.papers) state.bottomed = true;
    // Commit new state to history API
    history.replaceState(state , null, `/year/${state.year}`);
  };

  const handlePop = (event) => {
    if (event.state) {
      // Recycle the saved state
      state = event.state;
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
    state = reset(event.detail.value);
    // "Move" to a new page
    history.pushState(state , null, `/year/${year}`);
    update().then();
  };

  onMount(init);
</script>

<svelte:window on:popstate={handlePop}/>

<nav>
  <label class="label">View by year</label>
  <SearchBar {items} on:select={handleSelect}></SearchBar>
</nav>
<section>
  <PaperList {papers}></PaperList>
  <div class="announcer">
    {#if loading}
      <object type="image/svg+xml" data="/loading.svg"></object>
    {:else if !papers}
      <h2>No papers found</h2>
    {:else if !bottomed}
      <a role="button" on:click={update}>More</a>
    {/if}
  </div>
</section>

<style type="scss">
  @import "../style/variables.scss";

  nav {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .label {
    margin: $spacing--sm;
    @include text--lg;
  }
  
  .announcer {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: $spacing--lg 0;
    min-height: 4rem;
    min-width: 12rem;
  }
</style>
