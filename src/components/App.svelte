<script>
  import { onMount } from 'svelte';
  import PaperViewer from './PaperViewer.svelte';

  // Page state variables
  let year, papers;

  const currentYear = new Date().getFullYear();

  $: document.title = `${year} | DMRG Preprints`;
  let loading = true;

  const init = () => {
    // Check if url is of the form /year/:year
    const url = new URL(document.location);
    const match = url.pathname.match(/\/year\/(\d+)/);
    year = match ? parseInt(match[1]) : currentYear;
    // TODO 404
    update();
  };

  const update = async () => {
    // Call API
    loading = true;
    let url = `/api/papers?year=${year}`;
    if (year === currentYear) url += `&update=true`;

    const res = await fetch(url);

    if (!res.ok) {
      loading = false;
      throw new Error(`Could not load ${url}`);
    }

    papers = await res.json();
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
      console.warn('Unexpected event in handleSelect');
      return;
    }
    // Skip if same year is selected
    if (event.detail.value === year) return;
    // Reset state
    year = event.detail.value;
    papers = [];
    // "Move" to a new page
    history.pushState({ year, papers }, null, `/year/${year}`);
    update();
  };

  onMount(init);
</script>

<svelte:window on:popstate={handlePop} />

<PaperViewer {year} {papers} {loading} on:select={handleSelect} />
