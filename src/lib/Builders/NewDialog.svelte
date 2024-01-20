<script lang="ts">
  import { createDialog, melt } from "@melt-ui/svelte";
  import type { Writable } from "svelte/store";
  import { fade, fly } from "svelte/transition";
  import Icon from "./Icon.svelte";

  export let alert = false;
  export let top = false;
  export { style as class };
  export { isOpen as open };
  export { titleInput as title };
  export let size = "w-[450px]";
  let titleInput: string;

  let style: string;
  let isOpen: Writable<boolean>;

  const {
    elements: {
      trigger,
      portalled,
      overlay,
      content,
      title,
      description,
      close,
    },
    states: { open },
  } = createDialog({
    role: alert ? "alertdialog" : "dialog",
  });

  $: isOpen = open;

  function closeDialog() {
    $open = false;
  }
</script>

<slot close={closeDialog} />

<button use:melt={$trigger} class={style}>
  <slot name="button" />
</button>

<div use:melt={$portalled}>
  {#if $open}
    <div
      in:fade
      out:fade={{ delay: 100 }}
      use:melt={$overlay}
      class="fixed inset-0 z-50 bg-white/50 dark:bg-black/50"
    />
    <div
      in:fly={{ delay: 100, y: 200 }}
      out:fly={{ y: 200 }}
      use:melt={$content}
      style="max-width: {size};"
      class="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-[90vw] translate-x-[-50%] translate-y-[-50%] p-4 rounded-2xl border-[1px] bg-backgroud-light dark:bg-backgroud-dark shadow-2xl border-border-light dark:border-border-dark {top
        ? 'z-[70]'
        : 'z-50'}"
    >
      <h2
        use:melt={$title}
        class="m-0 text-xl font-medium text-text-light dark:text-text-dark"
      >
        {titleInput}
      </h2>
      <div use:melt={$description} class="mt-2">
        <slot name="content" />
      </div>
      <button
        use:melt={$close}
        class="absolute right-[10px] top-[10px] inline-flex h-6 w-6 appearance-none items-center justify-center rounded-full bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition"
      >
        <Icon icon="close" scale="1rem"></Icon>
      </button>
    </div>
  {/if}
</div>
