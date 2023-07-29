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
    import { add, remove } from '$lib/Meetings/meetings.js';

    let client = getContext('client') as ReturnType<typeof firebaseClient>;

    let warning = getContext('warning') as Writable<Warning | undefined>;

    format.plugin(meridiem);

    export let data;

    let unsubscribe: Unsubscriber | undefined;

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
        if($client == undefined || $client.team == undefined) return;
        unsubscribe = client.doc<any>(doc(client.getFirestore(), "teams", $client.team, "meetings", data.meeting.id)).subscribe(async (value) => {
            let currentMeeting = value;
            if(currentMeeting == undefined) return;

            let signups = new Array<SecondaryUser>();

            for(let i = 0; i < currentMeeting.signups.length; i++) {
                const user = await client.getUser((currentMeeting.signups as DocumentReference[])[i].id); //function checks cache then server, so if its undefined, it means it couldn't find it in either

                if(user != undefined) {
                    signups.push(user);
                }
            }

            let synopsis: SecondaryUser | undefined = undefined;
            let mentor: SecondaryUser | undefined = undefined;
        
            if(currentMeeting.synopsis != null) {
                synopsis = await client.getUser(currentMeeting.synopsis.id) as SecondaryUser;
            }

            if(currentMeeting.mentor != null) {
                mentor = await client.getUser(currentMeeting.mentor.id) as SecondaryUser;
            }

            data.meeting = {
                name: currentMeeting.name as string,
                lead: await client.getUser(currentMeeting.lead.id) as SecondaryUser,
                synopsis: currentMeeting.synopsis == null ? undefined : synopsis == undefined ? "User Not Found" : synopsis,
                mentor: currentMeeting.mentor == null ? undefined : mentor == undefined ? "User Not Found" : mentor,
                location: currentMeeting.location as string,
                when_start: currentMeeting.when_start.toDate() as Date,
                when_end: currentMeeting.when_end.toDate() as Date,
                thumbnail: currentMeeting.thumbnail as string,
                completed: currentMeeting.completed as boolean,
                id: data.meeting.id,
                signups: signups,
            }
        });
    })

    onDestroy(() => {
        if(unsubscribe != undefined) {
            unsubscribe();
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
    <div class="w-[36rem] lg:w-[44rem]">
        <div class="w-full flex justify-between">
            <a href="/meetings{data.meeting.completed ? "?completed=true" : ""}" class="flex gap-1 p-1 mb-2 pr-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition lg:text-lg">
                <Icon scale={0} class="text-[1.25rem] w-[1.25rem] h-[1.25rem] lg:text-[1.5rem] lg:w-[1.5rem] lg:h-[1.5rem]" icon=arrow_back></Icon>
                <p>Back</p>
            </a>
            {#if data.meeting.completed === false}
                <a href="/meetings/{data.meeting.id}/edit" class="flex gap-1 p-1 mb-2 pr-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition lg:text-lg">
                    <Icon scale={0} class="text-[1.25rem] w-[1.25rem] h-[1.25rem] lg:text-[1.5rem] lg:w-[1.5rem] lg:h-[1.5rem]" icon=edit></Icon>
                    <p>Edit</p>
                </a>
            {:else}
                <a href="/synopsis/{data.meeting.id}" class="flex gap-1 p-1 mb-2 pl-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition lg:text-lg">
                    <p>Synopsis</p>
                    <Icon scale={0} class="text-[1.25rem] w-[1.25rem] h-[1.25rem] lg:text-[1.5rem] lg:w-[1.5rem] lg:h-[1.5rem]" icon=arrow_forward></Icon>
                </a>
            {/if}
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
        <div>
            <div class="mt-6 flex gap-2 items-center">
                <div class="-translate-y-[1px]">
                    <Icon class="text-[1.75rem] w-[1.75rem] h-[1.75rem] lg:text-[2.25rem] lg:w-[2.25rem] lg:h-[2.25rem]" scale={0} icon=schedule></Icon>
                </div>
                <p class="text-lg lg:text-xl">{format.format(data.meeting.when_start, "M/D/YY, h:mm a")} - {format.format(data.meeting.when_end, "h:mm a")}</p>
            </div>
            <div class="mt-4 flex gap-2 items-center">
                <div class="-translate-y-[2px]">
                    <Icon class="text-[1.75rem] w-[1.75rem] h-[1.75rem] lg:text-[2.25rem] lg:w-[2.25rem] lg:h-[2.25rem]" scale={0} icon=star></Icon>
                </div>
                <span class="text-lg lg:text-xl">Lead:</span>
                <MiniProfile user={data.meeting.lead}></MiniProfile>
            </div>
            {#if data.meeting.synopsis != undefined}
                <div class="mt-4 flex gap-2 items-center">
                    <Icon class="text-[1.75rem] w-[1.75rem] h-[1.75rem] lg:text-[2.25rem] lg:w-[2.25rem] lg:h-[2.25rem]" scale={0} icon=assignment></Icon>
                    <span class="text-lg lg:text-xl">Synopsis:</span>
                    {#if typeof data.meeting.synopsis != 'object' }
                        <MiniProfile user={undefined}></MiniProfile>
                    {:else}
                        <MiniProfile user={data.meeting.synopsis}></MiniProfile>
                    {/if}
                </div>
            {/if}
            {#if data.meeting.mentor != undefined}
                <div class="mt-4 flex gap-2 items-center">
                    <Icon class="text-[1.75rem] w-[1.75rem] h-[1.75rem] lg:text-[2.25rem] lg:w-[2.25rem] lg:h-[2.25rem]" scale={0} icon=engineering></Icon>
                    <span class="text-lg lg:text-xl">Mentor:</span>
                    {#if typeof data.meeting.mentor != 'object' }
                        <MiniProfile user={undefined}></MiniProfile>
                    {:else}
                        <MiniProfile user={data.meeting.mentor}></MiniProfile>
                    {/if}
                </div>
            {/if}
            <div class="mt-4 flex gap-2 items-center mb-6">
                <Icon class="-translate-y-[1px] text-[1.75rem] w-[1.75rem] h-[1.75rem] lg:text-[2.25rem] lg:w-[2.25rem] lg:h-[2.25rem]" scale={0} icon=alarm></Icon>
                <span class="text-lg lg:text-xl">Completed:</span>
                <div class="{data.meeting.completed ? 'bg-green-500' : 'bg-red-500'} rounded-full h-8 w-8 lg:h-10 lg:w-10 flex justify-around items-center">
                    <Icon scale={0}  class="text-[1.75rem] w-[1.75rem] h-[1.75rem] lg:text-[2.25rem] lg:w-[2.25rem] lg:h-[2.25rem] text-backgroud-light dark:text-backgroud-dark" icon={data.meeting.completed ? 'check' : 'close'}></Icon>   
                </div>
            </div>
            <div class="p-4 lg:p-6 pb-2 lg:pb-4 bg-secondary-light dark:bg-secondary-dark text-secondary-text-light dark:text-secondary-text-dark rounded-2xl">
                <div class="flex items-center justify-between mb-4">
                    <h1 class="text-xl lg:text-2xl ml-1">Sign Up List:</h1>
                    {#if signedup}
                        <button class="b-primary lg:text-lg" on:click={() => { remove(data.meeting.id, client ) }}>Leave</button>
                    {:else}
                        <button class="b-accent lg:text-lg" on:click={() => { add(data.meeting.id, client ) }}>Sign Up</button>
                    {/if}
                </div>
                {#each data.meeting.signups as user}
                    {#if user != undefined}
                        <div class="flex items-center mb-3">
                            <img referrerpolicy="no-referrer" alt="{user.displayName}'s Profile Picture" src="{user.photoURL}" class="h-8 w-8 lg:h-9 lg:w-9 rounded-full ml-1 mr-2"/>
                            <h1 class="lg:text-lg">{user.displayName}</h1>
                        </div>
                    {/if}
                {:else}
                    <div class="w-full h-11 lg:h-12 items-center flex justify-around">
                        <h1 class="-translate-y-1 lg:text-lg">No one has signed up.</h1>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>