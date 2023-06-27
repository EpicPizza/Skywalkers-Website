<script lang=ts>
    import Icon from '$lib/Builders/Icon.svelte';
    import Line from '$lib/Builders/Line.svelte';
    import MiniProfile from '$lib/Components/MiniProfile.svelte';
    import { client, type FirestoreUser, type SecondaryUser } from '$lib/Firebase/firebase.js';
    import { warning } from '$lib/stores.js';
    import format from 'date-and-time';
    import meridiem from 'date-and-time/plugin/meridiem';
    import { doc, DocumentReference, getDoc, onSnapshot, runTransaction, type Unsubscribe } from 'firebase/firestore';
    import { onDestroy, onMount } from 'svelte';
    import type { Unsubscriber } from 'svelte/store';
    import { current } from 'tailwindcss/colors.js';
    import { add, remove } from '$lib/Meetings/signups';

    format.plugin(meridiem);

    export let data;

    let unsubscribe: Unsubscriber | undefined;
    let firestoreUnsubcribe: Unsubscribe | undefined;

    if(data.status.created) {
        warning.set({
            color: 'green',
            message: 'Meeting successfully created'
        })
    } else if(data.status.edited) {
        warning.set({
            color: 'green',
            message: 'Meeting successfully edited',
        })
    }

    onMount(() => {
        unsubscribe = client.subscribe(async (user) => {
            if(user == undefined || 'preload' in user || user.team == undefined) return;

            const ref = doc(client.getFirestore(), "teams", user.team, "meetings", data.meeting.id);

            firestoreUnsubcribe = onSnapshot(ref, async (value) => {
                let currentMeeting = value.data();
                if(currentMeeting == undefined) throw new Error("Meeting Not Found");

                let signups = new Array<SecondaryUser>();

                for(let i = 0; i < currentMeeting.signups.length; i++) {
                    const user = await client.getUser((currentMeeting.signups as DocumentReference[])[i].id); //function checks cache then server, so if its undefined, it means it couldn't find it in either

                    if(user != undefined) {
                        signups.push(user);
                    }
                }

                data.meeting = {
                    name: currentMeeting.name as string,
                    lead: await client.getUser(currentMeeting.lead.id) as SecondaryUser,
                    synopsis:  await client.getUser(currentMeeting.synopsis.id) as SecondaryUser,
                    mentor:  await client.getUser(currentMeeting.mentor.id) as SecondaryUser,
                    location: currentMeeting.location as string,
                    when_start: currentMeeting.when_start.toDate() as Date,
                    when_end: currentMeeting.when_end.toDate() as Date,
                    thumbnail: currentMeeting.thumbnail as string,
                    completed: currentMeeting.completed as boolean,
                    id: data.meeting.id,
                    signups: signups,
                }
            })
        })
    })

    onDestroy(() => {
        if(unsubscribe != undefined) {
            unsubscribe();
        }
        if(firestoreUnsubcribe != undefined) {
            firestoreUnsubcribe();
        } 
    })

    $: signedup = checkSignedUp(data.meeting.signups);

    function checkSignedUp(value: SecondaryUser[]) {
        for(let i = 0; i < value.length; i++) {
            if($client != undefined && value[i].id == $client.uid) {
                return true;
            }
        }

        return false;
    }
</script>

<svelte:head>
    <title>Skywalkers | Meeting Listing</title>
</svelte:head>

<div class="min-h-[calc(100dvh-4rem)] p-8 flex justify-around">
    <div class="w-[36rem]">
        <div class="w-full flex justify-between">
            <a href="/meetings{data.meeting.completed ? "?completed=true" : ""}" class="flex gap-1 p-1 mb-2 pr-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition">
                <Icon scale=1.25rem icon=arrow_back></Icon>
                <p>Back</p>
            </a>
            {#if data.meeting.completed === false}
                <a href="/meetings/{data.meeting.id}/edit" class="flex gap-1 p-1 mb-2 pr-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition">
                    <Icon scale=1.25rem icon=edit></Icon>
                    <p>Edit</p>
                </a>
            {:else}
                <a href="/synopsis/{data.meeting.id}" class="flex gap-1 p-1 mb-2 pl-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition">
                    <p>Synopsis</p>
                    <Icon scale=1.25rem icon=arrow_forward></Icon>
                </a>
            {/if}
        </div>
        <div class="p-4 border-border-light dark:border-border-dark border-[1px] rounded-2xl flex items-center">
            {#if data.meeting.thumbnail.startsWith("icon:")}
                <Icon scale=4rem icon={data.meeting.thumbnail.substring(5, data.meeting.thumbnail.length)}/>
            {/if}
            <div class="ml-4">
                <div class="text-2xl">{data.meeting.name}</div>
                <div class="text-lg opacity-80">At {data.meeting.location}</div>
            </div>
        </div>
        <div>
            <div class="mt-6 flex gap-2 items-center">
                <div class="-translate-y-[1px]">
                    <Icon scale=1.75rem icon=schedule></Icon>
                </div>
                <p class="text-lg">{format.format(data.meeting.when_start, "M/D, h:mm a")} - {format.format(data.meeting.when_end, "h:mm a")}</p>
            </div>
            <div class="mt-4 flex gap-2 items-center">
                <div class="-translate-y-[2px]">
                    <Icon scale=1.75rem icon=star></Icon>
                </div>
                <span class="text-lg">Lead:</span>
                <MiniProfile user={data.meeting.lead}></MiniProfile>
            </div>
            <div class="mt-4 flex gap-2 items-center">
                <Icon scale=1.75rem icon=assignment></Icon>
                <span class="text-lg">Synopsis:</span>
                <MiniProfile user={data.meeting.synopsis}></MiniProfile>
            </div>
            <div class="mt-4 flex gap-2 items-center">
                <Icon scale=1.75rem icon=engineering></Icon>
                <span class="text-lg">Mentor:</span>
                <MiniProfile user={data.meeting.mentor}></MiniProfile>
            </div>
            <div class="mt-4 flex gap-2 items-center mb-6">
                <Icon class="-translate-y-[1px]" scale=1.75rem icon=alarm></Icon>
                <span class="text-lg">Completed:</span>
                <div class="{data.meeting.completed ? 'bg-green-500' : 'bg-red-500'} rounded-full h-8 w-8 flex justify-around items-center">
                    <Icon scale=1.75rem class="text-backgroud-light dark:text-backgroud-dark" icon={data.meeting.completed ? 'check' : 'close'}></Icon>   
                </div>
            </div>
            <div class="p-4 pb-2 border-border-light dark:border-border-dark border-[1px] rounded-2xl">
                <div class="flex items-center justify-between mb-4">
                    <h1 class="text-xl ml-1">Sign Up List:</h1>
                    {#if signedup}
                        <button class="b-default" on:click={() => { remove(data.meeting.id) }}>Leave</button>
                    {:else}
                        <button class="b-green" on:click={() => { add(data.meeting.id) }}>Sign Up</button>
                    {/if}
                </div>
                {#each data.meeting.signups as user}
                    {#if user != undefined}
                        <div class="flex items-center my-3">
                            <img referrerpolicy="no-referrer" alt="{user.displayName}'s Profile Picture" src="{user.photoURL}" class="h-8 w-8 rounded-full ml-1 mr-2"/>
                            <h1>{user.displayName}</h1>
                        </div>
                    {/if}
                {:else}
                    <div class="w-full h-11 items-center flex justify-around">
                        <h1 class="-translate-y-1">No one has signed up.</h1>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>