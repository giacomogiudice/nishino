<script>
  export let offset = 10;
  export let tolerance = 20;
  export let y = 0;

  let yLast = 0;

  $: pinned = update(y);

  const update = (y) => {
    const delta = y - yLast;
    yLast = y;

    // Keep it open close to the top
    if (y < offset) return true;
    // Ignore small changes
    if (Math.abs(delta) < tolerance) return pinned;
    // Otherwise delta < 0 is up, delta > 0 is down
    return delta < 0;
  };
</script>

<pinned-content>
  <slot {pinned} />
</pinned-content>
