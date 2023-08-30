<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Tooltip from "$lib/Builders/Tooltip.svelte";
    import EditDialog from "$lib/Codes/EditDialog.svelte";
    import GenerateDialog from "$lib/Codes/GenerateDialog.svelte";
    import type { Code } from "$lib/Codes/codes.js";
    import type { firebaseClient } from "$lib/Firebase/firebase.js";
    import type { Warning } from "$lib/stores.js";
    import { deleteField, doc, runTransaction } from "firebase/firestore";
    import { getContext, onDestroy, onMount } from "svelte";
    import type { Writable } from "svelte/store";

    let client = getContext('client') as ReturnType<typeof firebaseClient>;

    let warning = getContext('warning') as Writable<Warning | undefined>;

    export let data;

    let unsubscribe: Function;

    onMount(() => {
        if($client == undefined || $client.team == undefined) return;
        unsubscribe = client.doc<any>(doc(client.getFirestore(), "teams", $client.team), structuredClone(data.codes)).subscribe(async (snapshotData) => {
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
            if(user == undefined || 'preload' in user || user.team == undefined) return;

            await fetch("/settings/codes", {
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
    let openEdit = false;
</script>

<svelte:head>
    <title>Skywalkers | Codes</title>
</svelte:head>

<GenerateDialog bind:open={openGenerate} data={data.forms.generate}/>
<EditDialog bind:open={openEdit} bind:selected codes={data.codes} data={data.forms.edit}/>

<div class="flex justify-between min-w-full items-center">
    <div class="flex items-end">
        <h1 class="text-3xl font-light mr-2">Codes</h1>
        <p class="text-sm mb-1 opacity-50">(Team {$client?.team})</p>
    </div>
    <button on:click={() => { openGenerate = !openGenerate; }} class="b-accent">Generate</button>
</div>

<Line class="mt-2"></Line>

<div class="pt-4 grid grid-cols-[repeat(auto-fill,minmax(11.5rem,1fr))] gap-2">
    {#each [... data.codes] as [key, value]}
        <div class="pr-2 w-full flex items-center justify-between">
            <button on:click={() => { if(!selected.includes(key)) { selected.push(key); } else { selected.splice(selected.indexOf(key), 1); } selected = selected; }} class="px-2 mr-2 py-1 text-left w-full transition rounded-md bg-black dark:bg-white {selected.includes(key) ? "bg-opacity-5 dark:bg-opacity-5" : "bg-opacity-0 dark:bg-opacity-0"}">
                <Tooltip text={"access: " + value.access}>
                    <div class="flex items-center">
                        <span>{key}:</span>
                        <span class="p-0.5 px-2 ml-1 {(() => {
                            if(value.role == 'parent') {
                                return 'bg-red-500 dark:text-red-500 text-red-900';
                            } else if(value.role == 'student') {
                                return 'bg-green-500 dark:text-green-500 text-green-900';
                            } else {
                                return 'bg-yellow-500 dark:text-yellow-500 text-yellow-900'
                            }
                        })()} bg-opacity-30 dark:bg-opacity-10 rounded-md">
                            {value.role}
                        </span>
                    </div>
                </Tooltip>
            </button>
            <button on:click={() => { window.navigator.clipboard.writeText(window.location.origin + "/verify/" + value.id).then(() => { warning.set({ color: 'green', message: "Copied!" }) }).catch(() => { warning.set({ color: 'red', message: 'Failed to copy.' }) }) }} class="min-w-7 min-h-7 w-7 h-7 transition rounded-md dark:bg-white bg-black dark:bg-opacity-0 bg-opacity-0 dark:hover:bg-opacity-10 hover:bg-opacity-10">
                <Tooltip text="Copy Link" class="flex items-center justify-around w-full h-full">
                    <Icon icon=link scale=1.25rem></Icon>
                </Tooltip>
            </button>
        </div>
    {/each}
</div>

{#if data.codes.size == 0}
    <p class="text-red-500 text-lg dark:text-red-500 text-center w-full font-bold">No Active Codes Found</p>
{/if}

<div class="flex items-center justify-between mt-6">
    <p class="opacity-50 text-sm">Select codes to delete<span class="mx-0.5">/</span>edit:</p>
    <div class="flex gap-2">
        <button on:click={() => { openEdit = !openEdit; }} disabled={selected.length != 1} class="b-primary disabled:opacity-50 disabled:cursor-not-allowed">Edit</button>
        <button on:click={handleDelete} disabled={selected.length == 0} class="b-primary disabled:opacity-50 disabled:cursor-not-allowed">Delete</button>
    </div>
</div>