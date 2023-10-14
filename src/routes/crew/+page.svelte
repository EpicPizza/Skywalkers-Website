<script lang=ts>
    import DatePicker from "$lib/Builders/DatePicker.svelte";
    import Ellipse from "$lib/Builders/Ellipse.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    import Tooltip from "$lib/Builders/Tooltip.svelte";
    import Member from "$lib/Components/Member.svelte";
    import PersonChooser from "$lib/Components/PersonChooser.svelte";
    import PersonDialog from "$lib/Components/PersonDialog.svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import format from 'date-and-time';
    import meridiem from 'date-and-time/plugin/meridiem';
    import { doc, onSnapshot, setDoc } from "firebase/firestore";
    import { getContext, onMount } from "svelte";
    import { writable, type Writable } from "svelte/store";

    format.plugin(meridiem);
    
    let client = getContext('client') as ReturnType<typeof firebaseClient>;

    export let data;

    let table: Writable<({ type: 'blank' | 'title' | 'id', value: string } | { type: 'timing', value: { starts: Date, ends: Date, allday: boolean} })[][]> = writable(JSON.parse(data.table, dateTimeReviver));

    function dateTimeReviver(key: any, value: string) {
        if(key == 'starts' || key == 'ends') {
            return new Date(value);
        } else {
            return value;
        }
    }

    function addRow(i: number) {
        let columns = $table[0].length;

        let row: ({ type: 'blank' | 'title' | 'id', value: string } | { type: 'timing', value: { starts: Date, ends: Date, allday: boolean} })[] = [
            { type: 'timing', value: { starts: new Date(), ends: new Date(), allday: true} }
        ]

        for(let i = 0; i < columns - 1; i++) {
            row.push({ type: 'id', value: ""});
        }

        $table.splice(i, 0, row);

        $table = $table;
    }

    function addColumn(i: number) {
        let rows = $table.length;

        for(let j = 0; j < rows; j++) {
            $table[j].splice(i, 0, (j == 0 ? { type: 'title', value: "" } : { type: 'id', value: "" }));
        }

        $table = $table;
    }

    function deleteRow(i: number) {
        $table.splice(i, 1);

        $table = $table;
    }

    function deleteColumn(i: number) {
        let rows = $table.length;

        for(let j = 0; j < rows; j++) {
            $table[j].splice(i, 1);
        }

        $table = $table;
    }

    let changes = false;
    let syncing = false;

    onMount(() => {
        let first = true;

        let unsubscribe = table.subscribe(() => {
            if(first) {
                first = false;
            } else {
                changes = true;
            }
        })

        const db = client.getFirestore();

        const ref = doc(db, "teams", $client ? $client.team ?? "123456" : "123456", "crew", "table")

        let interval = setInterval(async () => {
            if(changes) {
                syncing = true;
                changes = false;

                console.log("saving");

                await setDoc(ref, {
                    value: JSON.stringify($table),
                });

                syncing = false;
            }
        }, 1000);

        let unsubscribeFirestore = onSnapshot(ref, (snapshot) => {
            let data = snapshot.data();

            if(data == undefined || data.value == undefined) return;

            first = true;
            $table = JSON.parse(data.value, dateTimeReviver);
        })

        return () => {
            if(unsubscribe) unsubscribe();
            if(interval) clearInterval(interval);
            if(unsubscribeFirestore) unsubscribeFirestore();
        }
    })
</script>

<svelte:head>
    <title>Skywalkers | Crew</title>
</svelte:head>

{#if syncing || changes}
    <div class="absolute right-8 top-24">
        <Icon class="animate-spin scale-[-1]" icon=sync></Icon>
    </div>
{/if}

<div class="pt-12 min-h-[calc(100dvh-4rem)] bg-white dark:bg-zinc-900 overflow-hidden">
    <h1 class="font-bold text-4xl tracking-wide mb-8 text-center">Calgames Crew</h1>
    <div class="w-full overflow-x-auto overflow-y-auto px-8 py-4">
        <table>
            {#each $table as row, r}
                <tr>
                    {#each row as cell, i}
                        {#if cell.type == 'title' || cell.type == 'blank'}
                            <th class="px-0 py-0 border-[1px] border-b-[3px] border-border-light dark:border-border-dark border-b-text-light dark:border-b-text-dark relative">
                                {#if cell.type == 'title'}
                                    <input disabled={($client == undefined || $client.permissions == undefined || !$client.permissions.includes('EDIT_MEETINGS'))} style="background-color: transparent !important;" class="bg-zinc-950 px-5 py-3" bind:value={$table[r][i].value}>
                                {/if}
                                {#if !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('EDIT_MEETINGS'))}
                                    {#if cell.type == 'blank'}
                                        <button on:click={() => { addColumn(1) }} class="absolute opacity-0 hover:opacity-100 transition-opacity bg-primary-200 dark:bg-primary-700 p-0.5 rounded-full translate-x-1/2 right-0 top-1/2 -translate-y-1/2 z-10"><Icon icon=add></Icon></button>
                                        <button on:click={() => { addRow(1) }} class="absolute opacity-0 hover:opacity-100 transition-opacity bg-primary-200 dark:bg-primary-700 p-0.5 rounded-full translate-x-1/2 right-1/2 bottom-0 translate-y-1/2 z-10"><Icon icon=add></Icon></button>
                                    {:else}
                                        <button on:click={() => { addColumn(i + 1) }} class="absolute opacity-0 hover:opacity-100 transition-opacity bg-primary-200 dark:bg-primary-700 p-0.5 rounded-full translate-x-1/2 right-0 top-1/2 -translate-y-1/2 z-10"><Icon icon=add></Icon></button>
                                        <button on:click={() => { deleteColumn(i) }} class="absolute opacity-0 hover:opacity-100 transition-opacity bg-primary-200 dark:bg-primary-700 p-1 rounded-full translate-x-1/2 right-1/2 top-0 -translate-y-1/2 z-10"><Icon scale="1.25rem" icon=delete></Icon></button>
                                    {/if}
                                {/if}
                            </th>
                        {:else}
                            <td>
                                <div class="flex items-center gap-2">
                                    {#if cell.type == 'id'}
                                        <PersonDialog let:openDialog optional={true} on:choosen={(event) => { $table[r][i].value = event.detail.id ?? ""; }}>
                                            {#if cell.value == ""}
                                                {#if !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('EDIT_MEETINGS'))}
                                                    <button on:click={openDialog} class="hover:opacity-90 ml-auto mr-auto transition-opacity bg-primary-200 dark:bg-primary-700 p-0.5 rounded-full z-10"><Icon icon=add></Icon></button>
                                                {/if}
                                            {:else}
                                                <Member id={cell.value} let:member>
                                                    {#await member}
                                                        Loading<Ellipse></Ellipse>
                                                    {:then member}
                                                        <button disabled={($client == undefined || $client.permissions == undefined || !$client.permissions.includes('EDIT_MEETINGS'))} on:click={openDialog} class="flex items-center gap-1.5">
                                                            <img alt="{member.displayName}'s Profile" class="w-6 rounded-full h-6" src={member.photoURL}>
                                                            <p class="whitespace-nowrap">{member.displayName}</p>
                                                        </button>
                                                    {/await}
                                                </Member>
                                            {/if}
                                        </PersonDialog>
                                    {:else if cell.type == 'timing'}
                                        {#if !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('EDIT_MEETINGS'))}
                                            <Tooltip text="All Day">
                                                <button on:click={() => { if(cell.type == 'timing') cell.value.allday = !cell.value.allday; }} class="p-0.5 {cell.value.allday ? "border-blue-700 dark:border-blue-500 bg-blue-200 dark:bg-blue-900 text-blue-700 dark:text-blue-500" : "border-border-light dark:border-border-dark text-border-light dark:text-border-dark"} border-[1px] rounded-md m-0.5 transition disabled:cursor-not-allowed disabled:opacity-40">
                                                    <Icon icon=check scale="1rem"></Icon>
                                                </button>
                                            </Tooltip>
                                        {/if}
                                        {#if cell.value.allday}
                                            <p class="whitespace-nowrap">{format.format(cell.value.starts, "dddd")}</p>
                                        {:else}
                                            <p class="whitespace-nowrap">{format.format(cell.value.starts, "ddd, h:mma - ") + format.format(cell.value.ends, "h:mma")}</p>
                                        {/if}
                                        {#if !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('EDIT_MEETINGS'))}
                                            <DatePicker hideTimes={cell.value.allday} bind:startTime={cell.value.starts} bind:endTime={cell.value.ends} let:openDialog>
                                                <button on:click={openDialog}><Icon scale="1rem" class="-translate-x-0.5" icon=edit></Icon></button>
                                            </DatePicker>
                                            <button on:click={() => { addRow(r + 1) }} class="absolute opacity-0 hover:opacity-100 transition-opacity bg-primary-200 dark:bg-primary-700 p-0.5 rounded-full translate-x-1/2 right-1/2 bottom-0 translate-y-1/2 z-10"><Icon icon=add></Icon></button>
                                            <button on:click={() => { deleteRow(r) }} class="absolute opacity-0 hover:opacity-100 transition-opacity bg-primary-200 dark:bg-primary-700 p-1 rounded-full -translate-x-1/2 left-0 top-1/2 -translate-y-1/2 z-10"><Icon scale="1.25rem" icon=delete></Icon></button>
                                        {/if}
                                    {/if}
                                </div>
                            </td> 
                        {/if}
                    {/each}
                </tr>
            {/each}
        </table>
    </div>
</div>

<style lang=postcss>
    td {
        @apply px-5 py-3 border-[1px] border-border-light dark:border-border-dark relative;
    }
</style>