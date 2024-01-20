<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Tooltip from "$lib/Builders/Tooltip.svelte";
    import GenerateDialog from "$lib/Codes/GenerateDialog.svelte";
    import type { Code } from "$lib/Codes/codes.js";
    import type { firebaseClient } from "$lib/Firebase/firebase.js";
    import type { Warning, createCurrentTeam } from "$lib/stores.js";
    import { deleteField, doc, runTransaction } from "firebase/firestore";
    import { getContext, onDestroy, onMount } from "svelte";
    import type { Writable } from "svelte/store";
    import { page } from '$app/stores';

    let client = getContext('client') as ReturnType<typeof firebaseClient>;
    let team = getContext('team') as Writable<string>;
    let warning = getContext('warning') as Writable<Warning | undefined>;
    let teamInfo = getContext('teamInfo') as Writable<Map<string, { name: string, website: string, icon: string }>>
    let currentTeam = getContext('currentTeam') as ReturnType<typeof createCurrentTeam>;

    $: info = $teamInfo.get($page.params.team == undefined ? ($currentTeam ? $currentTeam.team : "000000") : $page.params.team);

    export let data;

    let unsubscribe: Function;

    onMount(() => {
        if($client == undefined || $client.teams == undefined) return;
        unsubscribe = client.doc<any>(doc(client.getFirestore(), "teams", $team), structuredClone(data.codes)).subscribe(async (snapshotData) => {
            if(snapshotData == undefined) {
                data.codes = new Map<string, Code>();
            } else {
                if('get' in snapshotData) {
                    data.codes = snapshotData;
                } else {
                    data.codes = new Map<string, Code>(Object.entries(snapshotData));
                }
            }
        });
    });

    onDestroy(() => {
        if(unsubscribe) unsubscribe();
    })

    let selected: string[] = [];

    function handleDelete() {
        const unsubscribeUser = client.subscribe(async (user) => {
            if(user == undefined || 'preload' in user || user.teams == undefined) return;

            await fetch("/t/" + $team + "/settings/invites", {
                method: "POST",
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    codes: selected,
                })
            })

            selected = [];

            if(unsubscribeUser) unsubscribeUser();
        })
    }

    let openGenerate = false;
</script>

<svelte:head>
    <title>{info?.name ?? "Skywalkers"} | Invites</title>
</svelte:head>

<GenerateDialog bind:open={openGenerate} data={data.forms.generate}/>

<div class="flex justify-between min-w-full items-center">
    <div class="flex items-end">
        <h1 class="text-3xl font-light mr-2">Invites</h1>
        <p class="text-sm mb-1 opacity-50">(Team {$team})</p>
    </div>
    <button on:click={() => { openGenerate = !openGenerate; }} class="b-accent">Invite</button>
</div>

<Line class="mt-2"></Line>

<div class="pt-4">
    {#each [... data.codes] as [key, value]}
        <div class="pr-2 w-full flex items-center justify-between mt-2">
            <button on:click={() => { if(!selected.includes(key)) { selected.push(key); } else { selected.splice(selected.indexOf(key), 1); } selected = selected; }} class="px-2 mr-2 py-1 text-left w-full transition rounded-md bg-black dark:bg-white {selected.includes(key) ? "bg-opacity-5 dark:bg-opacity-5" : "bg-opacity-0 dark:bg-opacity-0"}">
                <div class="flex items-center">
                    <p>{value.access}</p>
                    <p class="p-0.5 px-2 ml-1 {(() => {
                        if(value.role == 'parent') {
                            return 'bg-red-500 dark:text-red-500 text-red-900';
                        } else if(value.role == 'student') {
                            return 'bg-green-500 dark:text-green-500 text-green-900';
                        } else {
                            return 'bg-yellow-500 dark:text-yellow-500 text-yellow-900'
                        }
                    })()} bg-opacity-30 dark:bg-opacity-10 rounded-md">
                        {value.role}
                    </p>
                </div>
            </button>
            <button on:click={() => { window.navigator.clipboard.writeText(window.location.origin + "/t/" + $team + "/verify/" + value.id).then(() => { warning.set({ color: 'green', message: "Copied!" }) }).catch(() => { warning.set({ color: 'red', message: 'Failed to copy.' }) }) }} class="min-w-7 min-h-7 w-7 h-7 transition rounded-md dark:bg-white bg-black dark:bg-opacity-0 bg-opacity-0 dark:hover:bg-opacity-10 hover:bg-opacity-10">
                <Tooltip text="Copy Join Link" class="flex items-center justify-around w-full h-full">
                    <Icon icon=link scale=1.25rem></Icon>
                </Tooltip>
            </button>
        </div>
    {/each}
</div>

{#if data.codes.size == 0}
    <p class="text-red-500 text-lg dark:text-red-500 text-center w-full font-bold">No Active Invites Found</p>
{/if}

<div class="flex items-center justify-between mt-6">
    <p class="opacity-50 text-sm">Select invites to delete<span class="mx-0.5">/</span>edit:</p>
    <div class="flex gap-2">
        <button on:click={handleDelete} disabled={selected.length == 0} class="b-primary disabled:opacity-50 disabled:cursor-not-allowed">Delete</button>
    </div>
</div>