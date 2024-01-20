<script lang="ts">
  import { createCombobox, melt } from "@melt-ui/svelte";
  import { fly } from "svelte/transition";
  import Icon from "./Icon.svelte";
  import { string } from "zod";
  import type { Writable } from "svelte/store";

  export let className: string;
  export let list: { id: string; disabled: boolean; detail: any }[];
  export let placeholder: string;
  export let labelString: string;
  export let inputClass: string;
  export let labelClass: string;
  export let defaultChoice: string = "";

  export let name = "";

  const {
    elements: { menu, input, option, label },
    states: { open, inputValue, touchedInput, selected },
    helpers: { isSelected },
  } = createCombobox({
    forceVisible: true,
    multiple: false,
  });

  $: if (!$open) {
    $inputValue = $selected?.label ?? defaultChoice;
  }

  export let value: string;

  $: value = $inputValue;

  let inputElement: HTMLInputElement;
</script>

<div class={className}>
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label class={labelClass} use:melt={$label}>
    {labelString}
  </label>

  <div class="relative w-full">
    <input
      bind:this={inputElement}
      use:melt={$input}
      class={inputClass}
      {placeholder}
      {name}
    />
    <button
      on:click|preventDefault={() => {
        inputElement.click();
        inputElement.focus();
      }}
      class="absolute right-2 top-1/2 z-10 -translate-y-1/2 text-text-light dark:text-text-dark"
    >
      {#if $open}
        <Icon icon="expand_more"></Icon>
      {:else}
        <Icon icon="expand_less"></Icon>
      {/if}
    </button>
  </div>
</div>

{#if $open}
  <ul
    class="z-[1000] flex max-h-[300px] flex-col overflow-hidden rounded-lg"
    use:melt={$menu}
    transition:fly={{ duration: 150, y: -5 }}
  >
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div
      class="flex max-h-full flex-col gap-0 overflow-y-auto bg-backgroud-light dark:bg-backgroud-dark px-2 py-2 text-text-light dark:text-text-dark border-border-light dark:border-border-dark border-[1px] rounded-lg"
      tabindex="0"
    >
      {#each list as item}
        <li
          use:melt={$option({
            value: item,
            label: item.id,
            disabled: item.disabled,
          })}
          class="relative cursor-pointer scroll-my-2 rounded-md py-2 pl-4 pr-4
        data-[highlighted]:bg-accent-500 data-[highlighted]:text-black
          data-[disabled]:opacity-50"
        >
          <slot selected={$isSelected(item)} detail={item.detail} />
        </li>
      {:else}
        <li
          class="relative cursor-pointer rounded-md py-1 pl-8 pr-4
        data-[highlighted]:bg-accent-100 data-[highlighted]:text-accent-700"
        >
          No results found
        </li>
      {/each}
    </div>
  </ul>
{/if}
