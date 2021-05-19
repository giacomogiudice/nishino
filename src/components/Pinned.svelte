<script>
  export let offset = 0;
  export let tolerance = 20;

  let y;
  let yLast = 0;

  $: hidden = update(y);

  const update = (y) => {
    const delta = y - yLast;
    yLast = y;

    // Keep it open close to the top
    if (y < offset) return false;
    // Ignore small changes
    if (Math.abs(delta) < tolerance) return hidden;
    // Otherwise delta < 0 is up, delta > 0 is down
    return delta > 0;
  };
</script>

<svelte:window bind:scrollY={y} />

<slot {hidden} />
