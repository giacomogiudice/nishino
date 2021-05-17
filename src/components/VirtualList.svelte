<!-- Shamelessly stealing @sveltejs/svelte-virtual-list, but adding missing onscroll event -->
<script>
  import { onMount, createEventDispatcher, tick } from "svelte";

  // props
  export let items;
  export let height = "100%";
  export let itemHeight = undefined;

  // read-only, but visible to consumers via bind:start
  export let start = 0;
  export let end = 0;

  // local state
  let heightMap = [];
  let rows;
  let viewport;
  let contents;
  let viewportHeight = 0;
  let visible;
  let mounted;

  let top = 0;
  let bottom = 0;
  let averageHeight;

  const dispatch = createEventDispatcher();

  $: visible = items.slice(start, end).map((data, i) => {
    return { index: i + start, data };
  });

  // whenever `items` changes, invalidate the current heightmap
  $: if (mounted) refresh(items, viewportHeight, itemHeight);

  async function refresh(items, viewportHeight, itemHeight) {
    const { scrollTop } = viewport;

    await tick(); // wait until the DOM is up to date

    let contentHeight = top - scrollTop;
    let i = start;

    while (contentHeight < viewportHeight && i < items.length) {
      let row = rows[i - start];

      if (!row) {
        end = i + 1;
        await tick(); // render the newly visible row
        row = rows[i - start];
      }

      const rowHeight = (heightMap[i] = itemHeight || row.offsetHeight);
      contentHeight += rowHeight;
      i += 1;
    }

    end = i;

    const remaining = items.length - end;
    averageHeight = (top + contentHeight) / end;

    bottom = remaining * averageHeight;
    heightMap.length = items.length;
  }

  async function handleScroll() {
    const { scrollTop } = viewport;

    dispatch("scroll", { scrollTop });

    const oldStart = start;

    for (let v = 0; v < rows.length; v += 1) {
      heightMap[start + v] = itemHeight || rows[v].offsetHeight;
    }

    let i = 0;
    let y = 0;

    while (i < items.length) {
      const rowHeight = heightMap[i] || averageHeight;
      if (y + rowHeight > scrollTop) {
        start = i;
        top = y;

        break;
      }

      y += rowHeight;
      i += 1;
    }

    while (i < items.length) {
      y += heightMap[i] || averageHeight;
      i += 1;

      if (y > scrollTop + viewportHeight) break;
    }

    end = i;

    const remaining = items.length - end;
    averageHeight = y / end;

    while (i < items.length) heightMap[i++] = averageHeight;
    bottom = remaining * averageHeight;

    // prevent jumping if we scrolled up into unknown territory
    if (start < oldStart) {
      await tick();

      let expectedHeight = 0;
      let actualHeight = 0;

      for (let i = start; i < oldStart; i += 1) {
        if (rows[i - start]) {
          expectedHeight += heightMap[i];
          actualHeight += itemHeight || rows[i - start].offsetHeight;
        }
      }

      const d = actualHeight - expectedHeight;
      viewport.scrollTo(0, scrollTop + d);
    }
  }

  // trigger initial refresh
  onMount(() => {
    rows = contents.getElementsByTagName("virtual-list-row");
    mounted = true;
  });
</script>

<virtual-list-viewport
  bind:this={viewport}
  bind:offsetHeight={viewportHeight}
  on:scroll={handleScroll}
  style="height: {height};">
  <virtual-list-contents
    bind:this={contents}
    style="padding-top: {top}px; padding-bottom: {bottom}px;">
    {#each visible as row (row.index)}
      <virtual-list-row>
        <slot item={row.data}>Missing template</slot>
      </virtual-list-row>
    {/each}
  </virtual-list-contents>
</virtual-list-viewport>

<style>
  virtual-list-viewport {
    position: relative;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    display: block;
  }

  virtual-list-contents,
  virtual-list-row {
    display: block;
  }

  virtual-list-row {
    overflow: hidden;
  }
</style>
