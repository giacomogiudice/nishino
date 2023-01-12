<!-- Adapting the code form @sveltejs/svelte-virtual-list, but using window as the parent element -->
<script>
  import { onMount, tick } from 'svelte';

  // props
  export let items;
  export let itemHeight = undefined;
  export let threshold = 0;

  // read-only, but visible to consumers via bind:start
  export let start = 0;
  export let end = 0;

  // local state
  let heightMap = [];
  let rows;
  let container;
  let content;
  let visible;
  let mounted;

  let top = 0;
  let bottom = 0;
  let averageHeight;

  $: visible = items.slice(start, end).map((data, i) => {
    return { index: i + start, data };
  });

  // Whenever `items` changes, invalidate the current heightmap
  $: if (mounted) refresh(items, itemHeight);

  const refresh = async (items, itemHeight) => {
    // Set y-origin to the top of the virtual-list-content
    let { top: y } = content.getBoundingClientRect();

    // Make sure the DOM is up to date
    await tick();

    // Add current row heights until you are past the viewport
    let i = start;

    while (y < window.innerHeight + threshold && i < items.length) {
      let row = rows[i - start];

      if (!row) {
        end = i + 1;
        await tick(); // render the newly visible row
        row = rows[i - start];
      }

      const rowHeight = (heightMap[i] = itemHeight || row.offsetHeight);
      y += rowHeight;
      i += 1;
    }

    end = i;

    const remaining = items.length - end;
    averageHeight = (top + y) / end;

    bottom = remaining * averageHeight;
    heightMap.length = items.length;
  };

  const update = async () => {
    const { top: containerTop } = container.getBoundingClientRect();

    // Recompute height map for visible rows
    for (let v = 0; v < rows.length; v += 1) {
      heightMap[start + v] = itemHeight || rows[v].offsetHeight;
    }

    // Start adding row heights into y
    let i = 0;
    let y = 0;

    while (i < items.length) {
      const rowHeight = heightMap[i] || averageHeight;
      // Set `start` we are going to enter the viewport
      if (containerTop + y + rowHeight > -threshold) {
        start = i;
        top = y;
        break;
      }

      y += rowHeight;
      i += 1;
    }

    // Keep adding past `start` until we exit the viewport
    while (i < items.length) {
      y += heightMap[i] || averageHeight;
      i += 1;

      if (containerTop + y > window.innerHeight + threshold) break;
    }

    end = i;

    // Estimate bottom padding
    const remaining = items.length - end;
    averageHeight = y / end;
    bottom = remaining * averageHeight;
  };

  // Trigger initial refresh
  onMount(() => {
    rows = content.getElementsByTagName('virtual-list-row');
    mounted = true;
  });
</script>

<svelte:window on:scroll={update} on:resize={update} />

<virtual-list-container
  bind:this={container}
  style="padding-top: {top}px; padding-bottom: {bottom}px;">
  <virtual-list-content bind:this={content}>
    {#each visible as row (row.index)}
      <virtual-list-row>
        <slot item={row.data}>Missing template</slot>
      </virtual-list-row>
    {/each}
  </virtual-list-content>
</virtual-list-container>

<style>
  virtual-list-container,
  virtual-list-content,
  virtual-list-row {
    display: block;
  }

  virtual-list-row {
    overflow: hidden;
  }
</style>
