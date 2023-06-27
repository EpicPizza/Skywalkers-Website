<script lang=ts>
    import { navLinks, navmenu, navmode, verified } from "$lib/stores";
    import { onDestroy } from "svelte";
    import ThemeSwitcher from "./ThemeSwitcher.svelte";
    import { browser } from '$app/environment'; 
    import { fade, slide, fly } from "svelte/transition";
    import { quintOut } from 'svelte/easing';

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

    let width: number;
</script>

<svelte:window on:keydown={keypress} bind:innerWidth={width}></svelte:window>

{#if $navmenu}
    <div transition:fly="{{ opacity: 1, duration: 300, easing: quintOut, x: -width}}" class="h-[calc(100dvh-4rem)] bg-slate-100 dark:bg-zinc-900 min-w-[300px] w-full left-0 flex flex-col items-center justify-between p-4">
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
{/if}

<style lang=postcss>
    hr {
        @apply my-1 border-zinc-300 dark:border-zinc-700
    }
</style>