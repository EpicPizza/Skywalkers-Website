<script lang=ts>
    import Background from "$lib/Builders/Background.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Loading from "$lib/Builders/Loading.svelte";
    import Page from "$lib/Builders/Page.svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import { getContext } from "svelte";

    let client = getContext('client') as ReturnType<typeof firebaseClient>;

    export let data;

    let time = 2;
    let reason = "";
</script>

{#if $client != undefined}
    <Background>
        <Page size=24rem expand>
            <h1 class="text-2xl font-bold">{$client.displayName}'s Hours</h1>
            <Line class="my-4 mt-2"></Line>
            <div class="bg-accent-light mb-4 dark:bg-accent-dark text-accent-text-light dark:text-accent-text-dark px-8 py-4 w-fit rounded-full">
                <p class="text-xl">Total: {data.hours.total} hour{data.hours.total == 1 ? "" : "s"}</p>
            </div>
            <div class="rounded-lg border-border-light dark:border-border-dark border-[1px] p-4 flex items-center gap-4">
                <Icon icon=add_circle></Icon>
                <div class="w-full">
                    <textarea placeholder="Add Reason" bind:value={reason} on:input={() => { reason = reason.replace(/\n/g, '') }} class="p-2 rounded-md w-full h-16 mb-0 whitespace-pre-wrap"/>
                    <div class="flex justify-between">
                        <div class="flex gap-1.5">
                            <button disabled={time <= 0} class="b-primary disabled:cursor-not-allowed w-9 h-9 flex items-center justify-around" on:click|preventDefault={() => { if(time < 0.25) { time = 0; } else if(time > 12) { time = 12; } else {  time -= 0.25; } }}><Icon scale=1.25rem icon=remove></Icon></button>
                            <input bind:value={time} class="p-1 px-2 w-16 text-center font-bold rounded-md"/>
                            <button disabled={time >= 12} class="b-primary disabled:cursor-not-allowed w-9 h-9 flex items-center justify-around" on:click|preventDefault={() => { if(time > 11.75) { time = 12; } else if(time < 0) { time = 0; } else {  time += 0.25; } }}><Icon scale=1.25rem icon=add></Icon></button>
                        </div>
                        <div class="flex gap-2 items-center">
                            <div class="scale-75 flex items-center h-[2.125rem] overflow-hidden">
                                <Loading></Loading>
                            </div>
                            <button class="b-primary">Add</button>
                        </div>
                    </div>
                </div>
            </div>
        </Page>
    </Background>
{/if}