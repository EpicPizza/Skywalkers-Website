<script lang=ts>
    import Icon from '$lib/Builders/Icon.svelte';
    import MiniProfile from '$lib/Components/MiniProfile.svelte';
    import type { firebaseClient, SecondaryUser } from '$lib/Firebase/firebase.js';
    import type { Warning } from '$lib/stores.js';
    import format from 'date-and-time';
    import meridiem from 'date-and-time/plugin/meridiem';
    import { doc, documentId, DocumentReference, onSnapshot, type Unsubscribe } from 'firebase/firestore';
    import { onDestroy, onMount, getContext } from 'svelte';
    import type { Unsubscriber, Writable } from 'svelte/store';
    import { add, deleteMeeting, remove } from "$lib/Meetings/meetings.js";
    import { goto } from '$app/navigation';
    import Line from '$lib/Builders/Line.svelte';
    import { symbol } from 'zod';

    let client = getContext('client') as ReturnType<typeof firebaseClient>;

    let warning = getContext('warning') as Writable<Warning | undefined>;

    format.plugin(meridiem);

    export let data;

    let unsubscribe: Unsubscriber | undefined;

    onMount(() => {
        console.log(data.synopsis);

        if($client == undefined || $client.team == undefined) return;
        unsubscribe = client.doc<any>(doc(client.getFirestore(), "teams", $client.team, "meetings", data.meeting.id), "loading").subscribe(async (value) => {
            if(value == "loading") return;

            if(value == undefined) {
                goto("/meetings" + (data.meeting.completed ? "?completed=true&deleted=true" : "?deleted=true"));
                return;
            }

            let currentMeeting = value;
            if(currentMeeting == undefined) return;

            data.meeting = {
                name: currentMeeting.name as string,
                location: currentMeeting.location as string,
                when_start: currentMeeting.when_start.toDate() as Date,
                when_end: currentMeeting.when_end.toDate() as Date,
                thumbnail: currentMeeting.thumbnail as string,
                completed: currentMeeting.completed as boolean,
                id: data.meeting.id,
                signups: [],
            }
        });
    })

    onDestroy(() => {
        if(unsubscribe != undefined) {
            unsubscribe();
        }
    })
</script>

<svelte:head>
    <title>Skywalkers | Meeting Listing</title>
</svelte:head>

<div class="min-h-[calc(100dvh-4rem)] p-8 flex justify-around">
    <div class="w-[36rem] lg:w-[44rem]">
        <div class="w-full flex justify-between">
            <button on:click={() => { history.back(); }} class="flex gap-1 p-1 mb-2 pr-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition lg:text-lg">
                <Icon scale={0} class="text-[1.25rem] w-[1.25rem] h-[1.25rem] lg:text-[1.5rem] lg:w-[1.5rem] lg:h-[1.5rem]" icon=arrow_back></Icon>
                <p>Back</p>
            </button>
        </div>
        <div class="p-4 lg:p-6 bg-accent-light dark:bg-accent-dark text-accent-text-light dark:text-accent-text-dark rounded-2xl flex items-center">
            {#if data.meeting.thumbnail.startsWith("icon:")}
                <Icon scale={0} class="text-[4rem] w-[4rem] h-[4rem] lg:text-[5rem] lg:w-[5rem] lg:h-[5rem]" icon={data.meeting.thumbnail.substring(5, data.meeting.thumbnail.length)}/>
            {/if}
            <div class="ml-4 lg:ml-5">
                <div class="text-2xl lg:text-3xl lg:mb-1">{data.meeting.name}</div>
                <div class="text-lg lg:text-xl opacity-80">At {data.meeting.location}</div>
            </div>
        </div>
        <p class="mt-4 lg:text-lg">
            {data.synopsis.body}
        </p>
        <Line class="my-4"></Line>
        <div class="gap-4 flex flex-col">
            {#each data.synopsis.hours as entry}
                <div class="flex items-center gap-2.5">
                    <img class="h-8 w-8 lg:h-9 lg:w-9 rounded-full" alt="{entry.member.displayName}{entry.member.pronouns == "" ? "" : " (" + entry.member.pronouns + ")"}'s Profile" src={entry.member.photoURL}/>
                    <p class="text-lg lg:text-xl grow overflow-hidden whitespace-nowrap overflow-ellipsis">{entry.member.displayName}{entry.member.pronouns == "" ? "" : " (" + entry.member.pronouns + ")"}</p>
                    <span class="bg-black  dark:bg-white bg-opacity-10 ml-1 text-center text-lg dark:bg-opacity-10 p-1 px-2 rounded-lg">{entry.time} hour{entry.time == 1 ? "" : 's'}</span>
                </div>
            {:else}
                <div class="flex justify-around">
                    <p>No Members</p>
                </div>
            {/each}
        </div>
    </div>
</div>