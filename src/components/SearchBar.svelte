<script>
  import { createEventDispatcher } from "svelte";

  export let items = [];
  export let selected = undefined;
  export let text = selected ? selected.label : "";
  export let placeholder = "Search";
  export let open = false;

  let input, list;
  let highlighted = -1;

  const dispatch = createEventDispatcher();

  $: filteredItems = text !== "" ? items.filter(({ label }) => label.includes(text)) : items;

  const expand = () => {
    open = true;
    input.focus();
    text = "";
  };

  const collapse = () => {
    open = false;
    input.blur();
    if (selected) text = selected.label;
  };

  const handleClick = (event) => {
    const attr = event.target.getAttribute("data-index");
    !attr && console.warn("Target missing expected attribute during handleClick");
    const index = Number(attr);
    selected = items[index] || undefined;
    dispatch("select", selected);
    collapse();
  };

  const handleMouseEnter = (event) => {
    const attr = event.target.getAttribute("data-index");
    !attr && console.warn("Target missing expected attribute during handleMouseEnter");
    const index = Number(attr);
    highlighted = index || -1;
  };

  const handleKeyDown = (event) => {
    if (!open) return;

    switch (event.key) {
      case "Enter":
        event.preventDefault();
        if (filteredItems.length === 1) {
          selected = filteredItems[0];
        } else if (0 <= highlighted && highlighted < filteredItems.length) {
          selected = filteredItems[highlighted];
        } else {
          return;
        }
        dispatch("select", selected);
        collapse();
        break;
      case "Escape":
        collapse();
        break;
      case "ArrowDown":
        event.preventDefault();
        if (highlighted < filteredItems.length - 1) {
          highlighted++;
          scrollDownTo(highlighted);
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (highlighted > -1) {
          highlighted--;
          scrollUpTo(highlighted);
        }
        break;
    }
  };

  const scrollDownTo = (index) => {
    const item = list.querySelectorAll(".item")[index];
    if (!item) return;
    const offset = list.getBoundingClientRect().bottom - item.getBoundingClientRect().bottom;
    if (offset < 0) list.scrollTop -= offset;
  };

  const scrollUpTo = (index) => {
    const item = list.querySelectorAll(".item")[index];
    if (!item) return;
    const offset = list.getBoundingClientRect().top - item.getBoundingClientRect().top;
    if (offset > 0) list.scrollTop -= offset;
  };
</script>

<search-bar>
  {#if open}
    <div class="shadow" on:click={collapse} />
  {/if}
  <input
    type="text"
    {placeholder}
    autocomplete="off"
    bind:this={input}
    bind:value={text}
    on:keydown={handleKeyDown}
    on:focus={expand} />
  <search-bar-list class:open bind:this={list}>
    <ul>
      {#each filteredItems as { value, label }, ind}
        <li
          class="item"
          class:selected={selected ? selected.value === value : false}
          class:highlighted={ind === highlighted}
          data-index={ind}
          on:click={handleClick}
          on:mouseenter={handleMouseEnter}>
          {label}
        </li>
      {:else}
        <li class="no-items">∅</li>
      {/each}
    </ul>
  </search-bar-list>
</search-bar>

<style type="scss">
  @import "../style/variables.scss";

  search-bar {
    position: relative;
    width: 8ch;
    z-index: 2;
  }

  input {
  }

  search-bar-list {
    display: none;
    position: absolute;
    margin-top: $spacing--sm;
    width: 100%;
    max-height: 5 * 45px;
    overflow-y: scroll;
    -webkit-overflow-scrolling: touch;
    background-color: $color--background;
    z-index: 4;
    border-radius: $border-radius--md;
    box-shadow: $shadow;

    &.open {
      display: inherit;
    }

    ul {
      display: flex;
      flex-direction: column;
    }

    li {
      text-align: center;
      padding: $spacing--sm $spacing--sm;
    }
  }

  .no-items {
    color: $color--text-lighter;
  }

  .item {
    &:not(:last-child) {
      border-bottom: 1px solid $color--background-highlight;
    }

    &.highlighted {
      cursor: pointer;
      background-color: $color--background-highlight;
    }

    &.selected {
      cursor: pointer;
      background-color: $color--secondary;
      color: $color--background;
    }
  }

  .shadow {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    content: "";
    cursor: default;
  }
</style>
