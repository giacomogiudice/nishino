<script>
  import katex from "katex";
  import "katex/dist/katex.css";

  export let text = "";

  const options = {
    throwOnError: false
  };

  function render(text, options) {
    return text.replace(/\$([^\$]*)\$/g, (_, math) => katex.renderToString(math, options));
  }

  $: rendered = render(text, options);
</script>

{@html rendered}
