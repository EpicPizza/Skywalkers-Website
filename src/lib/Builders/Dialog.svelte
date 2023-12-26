<script lang=ts>
    import {
      Dialog,
      DialogOverlay,
      DialogTitle,
      DialogDescription,
    } from "@rgossiaux/svelte-headlessui";
    import { portal } from "svelte-portal";
    import { fade, fly } from "svelte/transition";
    import Icon from "./Icon.svelte";
    import { createEventDispatcher, getContext } from "svelte";
    import type { Writable } from "svelte/store";

    let dialogOpen = getContext('dialogOpen') as Writable<boolean>;

    export let isOpen = false;
    export let width = "32rem";
    export let top = false;

    export let raw = false

    $: $dialogOpen = isOpen;

    export let initialFocus: HTMLElement | undefined = undefined;
</script>

{#if isOpen}
    <div in:fade out:fade="{{ delay: 100 }}" use:portal class="fixed w-screen h-screen top-0 left-0 bg-white dark:bg-black opacity-60 {top ? "z-[60]" : "z-40"}"></div>
{/if}

{#if isOpen}
    <Dialog open={isOpen} bind:initialFocus={initialFocus} static>
        {#if raw}
            <div in:fade="{{ delay: 100 }}" out:fade class="fixed w-[100vw] h-[100dvh] left-0 top-0 {top ? "z-[70]" : "z-50"}">
                <div class="h-full w-full relative">
                    <DialogTitle><slot name="title"></slot></DialogTitle>
            
                    <DialogDescription>
                        <slot name="description"></slot>
                    </DialogDescription>

                    <slot name="content"></slot>

                    <slot></slot>
                </div>
                <button on:click={() => {isOpen = false;}} class="m-4 absolute rounded-md top-0 right-0 p-1 border-[2px] border-white bg-black hover:opacity-90 transition">
                    <Icon scale=1.75rem color=white icon=close></Icon>
                </button>
            </div>
            {:else}
            <div in:fly="{{ delay: 100, y: 200 }}" out:fly="{{ y: 200 }}" style="width: {width};" class="fixed max-w-[calc(100%-4rem)] max-h-[calc(100dvh-4rem)] p-4 rounded-2xl border-[1px] bg-backgroud-light dark:bg-backgroud-dark shadow-2xl -translate-y-1/2 -translate-x-1/2 left-1/2 top-1/2 overflow-scroll border-border-light dark:border-border-dark {top ? "z-[70]" : "z-50"}">
                <div class="h-full w-full relative">
                    <DialogTitle><slot name="title"></slot></DialogTitle>
            
                    <DialogDescription>
                        <slot name="description"></slot>
                    </DialogDescription>

                    <slot name="content"></slot>

                    <slot></slot>
                </div>
                <button on:click={() => {isOpen = false;}} class="m-4 absolute top-0 right-0 p-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-full transition">
                    <Icon scale=1.75rem icon=close></Icon>
                </button>
            </div>
        {/if}
    </Dialog> 
{/if}