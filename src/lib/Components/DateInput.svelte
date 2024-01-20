<script lang="ts">
  import format from "date-and-time";
  import { createEventDispatcher, onMount } from "svelte";
  import type { Unsubscriber, Writable } from "svelte/store";
  import { onDestroy } from "svelte";

  export { style as class };
  export let date: Date;
  export let name: string;
  export let element: HTMLInputElement;

  const dispatch = createEventDispatcher();

  let stringdate: string;
  let style = "";

  $: {
    if (date) {
      stringdate = format.format(date, "YYYY-MM-DD");
    }
  }

  let trytoparse = (input: string): Date => {
    console.log(format.parse(input, "YYYY-MM-DD"));
    if (stringdate != null && stringdate != undefined && stringdate != "") {
      return format.parse(input, "YYYY-MM-DD");
    } else {
      return date;
    }
  };

  let unsubscribe: Unsubscriber | undefined;

  onMount(() => {
    if (date) {
      stringdate = format.format(date, "YYYY-MM-DD");
    }
  });

  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });

  const onInput = (e: Event) => {
    date = trytoparse((e.target as any).value);
    console.log((e.target as any).value);
  };
</script>

<input
  on:keypress={(e) => {
    if (e.key == "Enter") {
      dispatch("enter");
    }
  }}
  bind:this={element}
  {name}
  type="date"
  value={stringdate}
  on:input={onInput}
  class={style}
/>
