<script lang="ts">
  export let href: string;
  let style: string = "";

  export { style as class };
</script>

<a class="text-blue-500 dark:text-blue-500 hover:underline {style}" {href}
  ><slot /></a
>
