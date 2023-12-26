<script lang=ts>
    import { page } from "$app/stores";
import type { createMode } from "$lib/stores";
    import { getContext, onMount } from "svelte";

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

<div style="padding-bottom: {bottom}; padding-top: {bottom};" class="px-4 h-[calc(100svh)] w-full bg-white dark:bg-zinc-800 bg-opacity-70 pattern">
    <div class="flex flex-col mt-20 justify-around items-center h-[calc(100svh-7.75rem)] w-full">
        <slot></slot>
    </div>
    {#if $page.url.pathname == "/"}
        <div class="bg-backgroud-light dark:bg-backgroud-dark border border-border-light dark:border-border-dark w-52 absolute bottom-4 rounded-xl right-4">
            <a href="https://www.firstinspires.org/robotics/frc/kickoff">
                <img alt="Crescendo FRC Game Logo" class="w-[calc(100%-1rem)] m-2 rounded-md" src="/crescendo.png"/>
            </a>
            <p class="text-center mb-2">{msg}</p>
        </div>
    {/if}
</div>