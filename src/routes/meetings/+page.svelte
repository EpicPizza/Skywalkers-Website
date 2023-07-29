<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import { Menu, MenuButton, MenuItem, MenuItems } from "@rgossiaux/svelte-headlessui";
    import format from "date-and-time";
    import meridiem from 'date-and-time/plugin/meridiem';
    import { add, deleteMeeting, remove } from "$lib/Meetings/meetings.js";
    import { getContext, onDestroy, onMount } from "svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase.js";
    import Loading from "$lib/Builders/Loading.svelte";
    import type { Unsubscriber, Writable } from "svelte/store";
    import { collection, limit, orderBy, query, where, type Unsubscribe, onSnapshot, Query } from "firebase/firestore";
    import { flip } from "svelte/animate";
    import type { DocumentData } from "firebase-admin/firestore";
    import type { Warning } from "$lib/stores.js";

    let client = getContext('client') as ReturnType<typeof firebaseClient>
    let bottom = getContext('bottom') as Writable<boolean>;
    let warning = getContext('warning') as Writable<Warning | undefined>;

    format.plugin(meridiem);

    export let data;

    if(data.deleted) {
        warning.set({
            message: "Meeting Deleted",
            color: 'red'
        })
    }

    let unsubscribeClient: Unsubscriber | undefined = undefined;
    let unsubscribeFirestore: Unsubscribe | undefined = undefined;

    let today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setMilliseconds(0);

    let number = 50;
    let lastFetched = 0;

    let returned = true;

    let reachedEnd = false;

    function loadNext() {
        if(unsubscribeClient) unsubscribeClient();

        unsubscribeClient = client.subscribe((user) => {
            if(user == undefined || 'preload' in user || user.team == undefined) return;

            const db = client.getFirestore();
            
            number += 25;

            const ref = query(collection(db, "teams", user.team, "meetings"), where("completed", "==", data.completed), where("when_start", ">=", today), orderBy("when_start"), limit(number));

            startListener(ref);
        });
    }

    let unsubscribeBottom: Unsubscriber | undefined = bottom.subscribe((isBottom) => {
        if(isBottom == true && returned == true && data.loading == false) {
            returned = false;

            loadNext();
        }

        if(isBottom == false && data.loading == false) {
            console.log("returned");
            returned = true;
        }
    });

    onMount(() => {
        if(unsubscribeClient) unsubscribeClient();

        unsubscribeClient = client.subscribe((user) => {
            if(user == undefined || 'preload' in user || user.team == undefined) return;

            const db = client.getFirestore();

            const ref = query(collection(db, "teams", user.team, "meetings"), where("completed", "==", data.completed), where("when_start", ">=", today), orderBy("when_start"), limit(number));

            startListener(ref);
        })
    })

    onDestroy(() => {
        if(unsubscribeClient) unsubscribeClient();
        if(unsubscribeFirestore) unsubscribeFirestore();
        if(unsubscribeBottom) unsubscribeBottom();
    })

    function startListener(ref: Query<DocumentData>) {
        if(reachedEnd) {
            number = lastFetched;
            return;
        }

        if(lastFetched == number) return;
        lastFetched = number;

        console.log(number);

        if(unsubscribeFirestore) unsubscribeFirestore();

        unsubscribeFirestore = onSnapshot(ref, (snapshot) => {
            const firestoreMeetings = snapshot.docs;

            const meetings = new Array<typeof data.meetings[0]>();

            for(let i = 0; i < firestoreMeetings.length; i++) {
                if(firestoreMeetings[i].data().name != "Default Meeting") {
                    let signedup = false;

                    for(let j = 0; j < firestoreMeetings[i].data().signups.length; j++) {
                        if(firestoreMeetings[i].data().signups[j].id == $client?.uid) {
                            signedup = true;
                        }
                    }

                    meetings.push({
                        name: firestoreMeetings[i].data().name as string,
                        id: firestoreMeetings[i].id as string,
                        location: firestoreMeetings[i].data().location as string,
                        thumbnail: firestoreMeetings[i].data().thumbnail as string,
                        when_start: firestoreMeetings[i].data().when_start.toDate() as Date,
                        when_end: firestoreMeetings[i].data().when_end.toDate() as Date,
                        signedup: signedup,
                    })
                }
            }

            if(meetings.length < number) {
                reachedEnd = true;
                lastFetched = meetings.length;
            } else {
                reachedEnd = false;
                lastFetched = meetings.length;
            }

            data.meetings = meetings;
            data.loading = false;
        })
    }

    let order: "Upcoming" | "Recent" = "Upcoming";

    function changeOrder(newOrder: "Upcoming" | "Recent") {
        if(unsubscribeClient) unsubscribeClient();

        data.loading = true;

        unsubscribeClient = client.subscribe((user) => {
            if(user == undefined || 'preload' in user || user.team == undefined) return;

            lastFetched = 0;
            number = 50;
            reachedEnd = false;

            const db = client.getFirestore();

            if(newOrder == 'Upcoming') {
                order = newOrder;

                const ref = query(collection(db, "teams", user.team, "meetings"), where("completed", "==", data.completed), where("when_start", ">=", today), orderBy("when_start"), limit(number));
                startListener(ref);
            } else {
                order = newOrder;

                const ref = query(collection(db, "teams", user.team, "meetings"), where("completed", "==", data.completed), where("when_start", "<", today), orderBy("when_start", "desc"), limit(number));
                startListener(ref);
            }
        })
    }
</script>

<svelte:head>
    <title>Skywalkers | {data.completed ? "Completed" : "Active"} Meetings</title>
</svelte:head>

<div class="min-h-[calc(100dvh-7rem)] lg:min-h-[calc(100dvh-7.5rem)] w-full bg-zinc-100 dark:bg-zinc-900 pb-[4.5rem] lg:pb-16 overflow-x-auto">
    <div class="p-4 pb-0 flex justify-between items-center">
        <p class="ml-1">Showing {lastFetched} {order} Meeting{lastFetched == 1 ? "" : "s"}</p>
        <div class="flex gap-2">
            <button on:click={() => { changeOrder('Upcoming') }} disabled={order == 'Upcoming'} class="{order == 'Upcoming' ? "b-accent" : "b-secondary"} disabled:cursor-not-allowed">Upcoming</button>
            <button on:click={() => { changeOrder('Recent') }} disabled={order == 'Recent'} class="{order == 'Recent' ? "b-accent" : "b-secondary"} disabled:cursor-not-allowed">Recent</button>
        </div>
    </div>
    <div class="min-w-[640px]">
        <div class="p-4 pb-2">
            {#each data.meetings as meeting (meeting.id)}
                <a animate:flip href="/meetings/{meeting.id}" class="flex box-content items-center w-full p-0 border-[1px] border-border-light dark:border-border-dark rounded-full h-12 lg:h-[3.5rem] mb-2">
                    <div class="ml-4">
                        {#if meeting.thumbnail.startsWith("icon:")}
                            <Icon scale=2rem icon={meeting.thumbnail.substring(5, meeting.thumbnail.length)}/>
                        {/if}
                    </div>
                    <div class="flex-grow-[1] flex items-center h-full">
                        <p class="text-left lg:text-lg ml-4">{meeting.name}</p>
                        <div class="bg-border-light dark:bg-border-dark w-[1px] ml-3 -mr-1 h-4/6"></div>
                        <p class="text-left lg:text-lg ml-4">At: {meeting.location}</p>
                        <div class="bg-border-light dark:bg-border-dark w-[1px] ml-3 -mr-1 h-4/6"></div>
                        <p class="text-left lg:text-lg ml-4">{format.format(meeting.when_start, "M/D/YY, h:mm a")} - {format.format(meeting.when_end, "h:mm a")}</p>
                    </div>
                    <Menu>
                        <MenuButton on:click={(event) => { event.preventDefault(); event.stopPropagation();}} class="rounded-full b-clear transition h-8 w-8 lg:w-[2.5rem] lg:h-[2.5rem] mr-2 flex items-center justify-around bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10">
                            <Icon scale={0} class="text-[1.5rem] w-[1.5rem] h-[1.5rem] lg:text-[1.6rem] lg:w-[1.5rem] lg:h-[1.6rem]" rounded={true} icon=more_vert/>
                        </MenuButton>
                        <MenuItems class="absolute z-10 right-6 max-w-[8rem] bg-backgroud-light dark:bg-backgroud-dark p-1.5 border-border-light dark:border-border-dark border-[1px] rounded-lg shadow-lg shadow-shadow-light dark:shadow-shadow-dark">

                            <MenuItem on:click={async (event) => { 
                                event.preventDefault(); 
                                event.stopPropagation(); 

                                if(meeting.signedup) {
                                    await remove(meeting.id, client);
                                } else {
                                    await add(meeting.id, client);
                                }
                            }} class="float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                                {#if meeting.signedup}
                                    Leave
                                {:else}
                                    Sign Up
                                {/if}
                            </MenuItem>
                            <MenuItem href="/meetings/{meeting.id}/edit" class="float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                                Edit
                            </MenuItem>
                            <MenuItem href="/meetings/{meeting.id}/duplicate" class="float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                                Duplicate
                            </MenuItem>
                            <MenuItem on:click={async (event) => {
                                event.preventDefault(); 
                                event.stopPropagation(); 

                                await deleteMeeting(meeting.id, client);
                            }} class="float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                                Delete                           
                            </MenuItem>
                        </MenuItems>
                    </Menu>
                </a>
            {:else}
                {#if data.loading}
                    <div class="w-screen absolute left-0 flex justify-around pt-8">
                        <Loading/>
                    </div>
                {:else}
                    <div class="w-screen absolute left-0 flex justify-around pt-8">
                        <p class="text-2xl text-red-500 dark:text-red-500 font-bold">No Meetings Found</p>
                    </div>
                {/if}
            {/each}
            {#if data.meetings.length != 0 && !reachedEnd}
                <div class="flex p-4 pt-0 justify-around -mb-[52px]">
                    <button class="b-primary" on:click={loadNext}>Load More Meetings</button>
                </div>
            {/if}
        </div>
    </div>
</div>

{#if !data.completed}
    <a href="/meetings/add" class="-mt-[58px] mr-4 mb-0 sticky float-right items-center bottom-16 lg:bottom-[4.25rem] px-4 pr-5 py-3 bg-backgroud-light flex dark:bg-backgroud-dark border-[1px] border-border-light dark:border-border-dark rounded-full shadow-lg shadow-shadow-light dark:shadow-shadow-dark hover:brightness-[95%] transition w-fit">
        <Icon class="mr-1" scale=2rem icon=add></Icon>
        <p class="text-lg">Create Meeting</p>
    </a>
{/if}

<div class="h-12 lg:h-14 sticky z-[5] bottom-0 border-border-light dark:border-border-dark border-t-[1px] bg-backgroud-light dark:bg-backgroud-dark w-full flex px-1.5 gap-1.5">
    <svelte:element this={data.completed ? "a" : "div"} href={data.completed ? "/meetings" : undefined} class="w-full text-center lg:text-lg my-1.5 rounded-md {data.completed ? "bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10" : "bg-accent-light dark:bg-accent-dark dark:text-accent-text-dark text-accent-text-light text-dcursor-not-allowed"} transition flex justify-around items-center">
        Active
    </svelte:element>
    <svelte:element this={data.completed ? "div" : "a"} href={data.completed ? undefined : "/meetings?completed=true"} class="w-full lg:text-lg  text-center my-1.5 rounded-md {!data.completed ? "bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10" : "bg-accent-light dark:bg-accent-dark dark:text-accent-text-dark text-accent-text-light text-dcursor-not-allowed"} transition flex justify-around items-center">
        Completed
    </svelte:element>
</div>