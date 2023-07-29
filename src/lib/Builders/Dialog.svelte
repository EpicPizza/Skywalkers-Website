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

    $: $dialogOpen = isOpen;

    let height: number;

    export let initialFocus: HTMLElement | undefined = undefined;
</script>

<svelte:window bind:innerHeight={height}></svelte:window>

{#if isOpen}
    <div in:fade out:fade="{{ delay: 100 }}" use:portal class="fixed w-screen h-screen top-0 left-0 bg-white dark:bg-black opacity-60 z-40"></div>
{/if}

{#if isOpen}
    <div in:fly="{{ delay: 100, y: height }}" out:fly="{{ y: height }}" >
        <Dialog open={isOpen} bind:initialFocus={initialFocus} static>
            <div style="width: {width};" class="fixed max-w-[calc(100%-4rem)] max-h-[calc(100dvh-4rem)] -translate-y-1/2 -translate-x-1/2 left-1/2 top-1/2 bg-backgroud-light dark:bg-backgroud-dark p-4 overflow-scroll rounded-2xl border-[1px] border-border-light dark:border-border-dark shadow-2xl z-40">
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
        </Dialog> 
    </div>
{/if}

