<script lang="ts">
  import Icon from "$lib/Builders/Icon.svelte";
  import type { createMode, Warning } from "$lib/stores";
  import { get, type Writable } from "svelte/store";
  import { getContext, onMount } from "svelte";
  import colors from "tailwindcss/colors";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import { fade } from "svelte/transition";
  import { portal } from "svelte-portal";
  import { page } from "$app/stores";
  import { increment } from "firebase/firestore";

  let mode = getContext("mode") as ReturnType<typeof createMode>;

  let warning = getContext("warning") as Writable<Warning | undefined>;

  let color: string;
  let message: string;
  let popup: boolean;
  let id: number;

  let delay = tweened(0, {
    duration: 20000,
  });

  onMount(() => {
    warning.subscribe(async (value) => {
      if (value == undefined) return;

      id = Math.random() * 100;
      let current = id;

      popup = true;

      switch (value.color) {
        case "red":
          color = colors.red[500];
          break;
        case "yellow":
          color = colors.yellow[300];
          break;
        case "aqua":
          color = colors.blue[400];
          break;
        case "green":
          color = colors.green[500];
          break;
        case "default":
          if (get(mode) == "dark") {
            color = colors.gray[200];
          } else {
            color = colors.black;
          }
          break;
      }

      message = value.message;

      delay.set(1, {
        duration: 0,
      });

      await delay.set(0);

      if (current == id) {
        //prevent closing subsequent warning popups
        popup = false;
      }
    });
  });
</script>

{#if popup}
  <div
    out:fade
    use:portal
    class="fixed bottom-0 left-0 ml-2 mb-2 bg-backgroud-light dark:bg-backgroud-dark rounded-md border-border-light dark:border-border-dark border-[1px] shadow-2xl overflow-auto z-[1000]"
  >
    <div class="relative flex items-center p-4">
      <p class="whitespace-nowrap">{message}</p>
      {#if !$page.url.href.includes("public")}
        <button
          class="b-clear ml-4"
          on:click={() => {
            popup = false;
          }}
        >
          <Icon scale="1.75rem" icon="close" />
        </button>
      {/if}
    </div>
    <div
      style="width: {$delay * 100}%; background-color: {color};"
      class="absolute h-1 bottom-0 left-0"
    ></div>
  </div>
{/if}
