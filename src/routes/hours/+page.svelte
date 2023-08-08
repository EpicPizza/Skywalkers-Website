<script lang=ts>
    import Background from "$lib/Builders/Background.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Page from "$lib/Builders/Page.svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import { getContext } from "svelte";

    let client = getContext('client') as ReturnType<typeof firebaseClient>;
</script>

{#if $client != undefined}
    <Background>
        <Page size=24rem expand>
            <div class="flex items-baseline gap-2">
                <h1 class="text-2xl font-bold">Hours</h1>
                <h2 class="text-sm opacity-50">(Team {$client.team})</h2>
            </div>
            <Line class="my-4 mt-2"></Line>
            <a href="/hours/{$client.uid}" class="p-4 pr-6 w-full transition bg-black dark:bg-white bg-opacity-5 dark:bg-opacity-5 hover:bg-opacity-10 dark:hover:bg-opacity-10 flex items-center rounded-lg gap-4">
                <img class="w-12 h-12 rounded-full" alt="{$client.displayName}'s profile" src={$client.photoURL}/>
                <div class="flex flex-col gap-0.5 grow">
                    <h3>{$client.displayName}{$client.pronouns == "" ? "" : " (" + $client.pronouns + ")"}</h3>
                    <h4 class="opacity-50">{$client.role}</h4>
                </div>
                <Icon icon=open_in_new></Icon>
            </a>
        </Page>
    </Background>
{/if}