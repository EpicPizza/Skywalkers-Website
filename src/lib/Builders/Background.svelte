<script lang=ts>
    import { page } from "$app/stores";
import type { createMode } from "$lib/stores";
    import { getContext, onMount } from "svelte";
    import Icon from "./Icon.svelte";

    let mode = getContext('mode') as ReturnType<typeof createMode>;

    let bottom = "1rem";

    let msg = "";

    function countdown() {
        const kickoff = new Date(1704560400000);
        const now = new Date();

        let diff = kickoff.valueOf() - now.valueOf();
    
        if(diff < 0) {
            msg = "NOW"
        } else {
            const days = (diff - diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60 * 24);
            diff = diff % (1000 * 60 * 60 * 24);
            const hours = (diff - diff % (1000 * 60 * 60)) / (1000 * 60 * 60);
            diff = diff % (1000 * 60 * 60);
            const minutes = (diff - diff % (1000 * 60)) / (1000 * 60);
            diff = diff % (1000 * 60);
            const seconds = (diff - diff % (1000)) / (1000);

            msg = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }
    }

    countdown();

    let interval: NodeJS.Timeout;

    onMount(() => {
        interval = setInterval(() => {
            countdown();
        }, 500);

        return () => {
            clearInterval(interval);
        }
    })
</script>

<div style="padding-bottom: {bottom}; padding-top: {bottom};" class="px-4 h-[calc(100dvh)] border-b border-border-light dark:border-border-dark w-full bg-white dark:bg-zinc-800 bg-opacity-70 pattern">
    <div class="flex flex-col mt-20 justify-around items-center h-[calc(100svh-7.75rem)] w-full {( $page.url.pathname == "/t/" + $page.data.unverifiedTeam || $page.url.pathname == "/t/" + $page.data.unverifiedTeam + "/verify") || $page.url.pathname == "/team/choose" || $page.url.pathname.startsWith("/account") ? "pt-14 sm:pt-0" : "pt-0" }">
        <slot></slot>
    </div>
    {#if $page.url.pathname == "/t/" + $page.data.unverifiedTeam || $page.url.pathname == "/t/" + $page.data.unverifiedTeam + "/verify"}
        <a href="/team/choose" class="bg-backgroud-light dark:bg-backgroud-dark border border-border-light dark:border-border-dark px-4 absolute top-[88px] rounded-xl left-4 flex flex-col items-center shadow-sm dark:shadow-lg">
            <p class="text-center my-3 flex items-center gap-1.5 text-lg">
                <Icon scale=1.5rem icon="arrow_back"></Icon>
                Back
            </p>
        </a>
    {/if}
    {#if $page.url.pathname == "/team/choose"}
        <a href="/" class="bg-backgroud-light dark:bg-backgroud-dark border border-border-light dark:border-border-dark px-4 absolute top-[88px] rounded-xl left-4 flex flex-col items-center shadow-sm dark:shadow-lg">
            <p class="text-center my-3 flex items-center gap-1.5 text-lg">
                <Icon scale=1.5rem icon="arrow_back"></Icon>
                Back
            </p>
        </a>
    {/if}
    {#if $page.url.pathname.startsWith("/account")}
        <button on:click={() => { history.back(); }} class="bg-backgroud-light dark:bg-backgroud-dark border border-border-light dark:border-border-dark px-4 absolute top-[88px] rounded-xl left-4 flex flex-col items-center shadow-sm dark:shadow-lg">
            <p class="text-center my-3 flex items-center gap-1.5 text-lg">
                <Icon scale=1.5rem icon="arrow_back"></Icon>
                Back
            </p>
        </button>
    {/if}
</div>