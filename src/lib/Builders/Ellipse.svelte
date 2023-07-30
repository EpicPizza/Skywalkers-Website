<script lang=ts>
    import { onDestroy } from "svelte";
    import { onMount } from "svelte";

    let milliseconds: number;

    let interval: NodeJS.Timer | undefined = undefined;

    onMount(() => {
        interval = setInterval(() => {
            milliseconds = new Date().valueOf();
        }, 500);
    })

    $: phase = Math.floor((milliseconds % 2000) / 500);

    onDestroy(() => {
        if(interval) {
            clearInterval(interval);
        }
    })
</script>

<!-- svelte-ignore empty-block -->
{#if phase == 0}
    
{:else if phase == 1}
    .
{:else if phase == 2}
    ..
{:else}
    ...
{/if}