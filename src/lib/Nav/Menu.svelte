<script lang=ts>
    import { createVerified, navLinks } from "$lib/stores";
    import { getContext, onDestroy } from "svelte";
    import ThemeSwitcher from "./ThemeSwitcher.svelte";
    import { browser } from '$app/environment'; 
    import { fade, slide, fly } from "svelte/transition";
    import { quintOut } from 'svelte/easing';
    import type { Writable } from "svelte/store";
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';

    let verified = getContext('verified') as ReturnType<typeof createVerified>;

    let navmenu = getContext('navmenu') as Writable<boolean>;
    let navmode = getContext('navmode') as Writable<boolean>;

    let unsubscribeMenu = navmenu.subscribe((value) => {
        if(browser) {
            if(value == true) {
                document.body.style.overflowY = "hidden";
            } else {
                document.body.style.overflowY = "inherit";
            }
        }
    })

    let unsubscribeMode = navmode.subscribe((value) => { 
        if(value == true) { //false - reduced, true - full
            $navmenu = false;
        }
    })

    let keypress = (event: KeyboardEvent) => {
        if(event.key == "Escape") {
            $navmenu = false;
        }
    }

    onDestroy(() => {
        unsubscribeMenu();
        unsubscribeMode();
    });

    let windowHeight: number;

    $: height = windowHeight - 72;

    const offset = tweened(0, {
		duration: 200,
		easing: cubicOut
	});

    $: {
        if($navmenu) {
            offset.set(height);
        } else {
            offset.set(0);
        }
    }

</script>

<svelte:window on:keydown={keypress} bind:innerHeight={windowHeight}></svelte:window>

<div class="w-full overflow-hidden" style="height: {$offset}px">
    <div class="h-[calc(100dvh-72px)] bg-slate-100 dark:bg-zinc-900 min-w-[300px] w-full left-0 flex flex-col items-center justify-between p-4 rounded-xl">
        <div class="w-full overflow-auto">
            <div class="w-full">
                <hr>
                {#each $navLinks as link}
                    {#if link.protected && $verified === false}
                        <!-- svelte-ignore a11y-missing-attribute -->
                        <a class="opacity-50 hover:bg-opacity-0 dark:hover:bg-opacity-0 w-full p-4 flex flex-col items-center cursor-not-allowed">{link.display}</a>
                    {:else} 
                        <a on:click={() => { $navmenu = false }} href={link.href} class="w-full p-4 flex flex-col items-center hover:bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-20 transition rounded-md">{link.display}</a>
                    {/if}
                    <hr>
                {/each}
            </div>
        </div>
        <div class="pt-4">
            <ThemeSwitcher></ThemeSwitcher>
        </div>
    </div>
</div>

<style lang=postcss>
    hr {
        @apply my-1 border-zinc-300 dark:border-zinc-700
    }
</style>