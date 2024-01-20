<script lang=ts>
    import { invalidate, invalidateAll } from '$app/navigation';
    import Background from '$lib/Builders/Background.svelte';
    import Page from '$lib/Builders/Page.svelte';
    import { getContext, onDestroy, onMount } from 'svelte';
    import { browser } from '$app/environment'
    import type { Writable } from 'svelte/store';

    export let data;

    let teamInfo = getContext('teamInfo') as Writable<Map<string, { name: string, website: string, icon: string }>>

    onMount(() => {
        if(data.unverifiedTeam != null) {
            invalidateAll()
        }
    })
</script>

<Background>
    <Page expand size=20rem>
        <h1 class="text-3xl text-center font-light mb-4">What team are you in?</h1>
        {#each data.teams as team}
            <a href="/t/{team.id}" class="w-full inline-block mt-1">
                <button on:click={() => { $teamInfo.set(team.id, team); }} class="bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10 transition p-2 hover:bg-opacity-20 dark:hover:bg-opacity-20 rounded-md w-full h-full flex justify-around">
                    <div class="flex items-center">
                        <img class="w-7 h-7 rounded-md mr-2" src="{team.icon}">
                        <p class="text-lg">{team.name}</p>
                    </div>
                </button>
            </a>
        {/each}
    </Page>
</Background>