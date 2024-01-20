<script context="module" lang="ts">
  let lastTriggered: Date | undefined = undefined;
</script>

<script lang="ts">
  import { getContext, onDestroy, onMount } from "svelte";
  import { portal } from "svelte-portal";
  import type { Unsubscriber, Writable } from "svelte/store";

  export let bottom = false;

  let onScroll = getContext("onScroll") as Writable<boolean>;

  let content: HTMLDivElement;
  let tooltip: HTMLDivElement;
  let windowHeight: number;
  let windowWidth: number;

  let style = "";
  export { style as class };
  let hover = false;
  let waiting = false;

  let x = 0;
  let y = 0;
  let width = 0;

  function onHover() {
    if (lastTriggered && new Date().valueOf() - lastTriggered.valueOf() < 250) {
      start();
    } else {
      waiting = true;
      setTimeout(() => {
        if (waiting) {
          start();
        }
      }, 1000);
    }
  }

  function start() {
    hover = true;
    y = windowHeight - content.getBoundingClientRect().y;
    if (bottom) {
      y = y - content.getBoundingClientRect().height - 32.5;
    }
    width = content.getBoundingClientRect().width + windowWidth * 2;
    x = content.getBoundingClientRect().x - windowWidth;
  }

  function check(e: TouchEvent) {
    if (
      content &&
      e.target &&
      !content.contains(e.target as any) &&
      !e.defaultPrevented
    ) {
      hover = false;
    }
  }

  function update() {
    if (hover) {
      y = windowHeight - content.getBoundingClientRect().y;
      width = content.getBoundingClientRect().width + windowWidth * 2;
      x = content.getBoundingClientRect().x - windowWidth;
    }
  }

  function end() {
    if (hover) {
      lastTriggered = new Date();
    }
    hover = false;
    waiting = false;
  }

  export let text = "";

  let scrollListener: Unsubscriber;

  onMount(() => {
    scrollListener = onScroll.subscribe(() => {
      update();
    });
  });

  onDestroy(() => {
    if (scrollListener) {
      scrollListener();
    }
  });
</script>

<svelte:window
  on:touchstart={check}
  bind:innerHeight={windowHeight}
  bind:innerWidth={windowWidth}
/>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class={style}
  on:mouseenter={onHover}
  on:focusin={start}
  on:focusout={end}
  on:touchstart={start}
  on:mouseleave={end}
  bind:this={content}
>
  <slot />
</div>

{#if hover}
  <div
    style="left: {x}px; bottom: {y}px; width: {width}px"
    bind:this={tooltip}
    use:portal={"body"}
    class="fixed z-[100] flex flex-col items-center overflow-visible"
  >
    {#if bottom}
      <div class="h-2 w-2 rotate-45 rounded-sm bg-black -mb-[0.3rem]"></div>
    {/if}
    <span class="bg-black text-sm text-white p-1 px-1.5 rounded-md w-fit"
      >{text}</span
    >
    {#if !bottom}
      <div class="h-2 w-2 rotate-45 rounded-sm bg-black -mt-[0.3rem]"></div>
    {/if}
  </div>
{/if}
