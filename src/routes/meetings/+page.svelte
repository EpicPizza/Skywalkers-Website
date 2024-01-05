<script lang=ts>
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import DatePicker from "$lib/Builders/DatePicker.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Loading from "$lib/Builders/Loading.svelte";
    import type { SecondaryUser, firebaseClient } from "$lib/Firebase/firebase";
    import { remove, add, deleteMeetings, deleteMeeting } from "$lib/Meetings/meetings";
    import { dev as env } from '$app/environment';
    import { Menu, MenuButton, MenuItems, MenuItem } from "@rgossiaux/svelte-headlessui";
    import Dialog from "$lib/Builders/Dialog.svelte";
    import format from "date-and-time";
    import meridiem from "date-and-time/plugin/meridiem";
    import type { Query, DocumentData } from "firebase/firestore";
    import type { Unsubscribe } from "firebase/auth";
    import { query, collection, where, orderBy, limit, onSnapshot } from "firebase/firestore";
    import type { Warning } from "$lib/stores.js";
    import { getContext, onMount, onDestroy } from "svelte";
    import { flip } from "svelte/animate";
    import { type Writable, type Unsubscriber, writable, get } from "svelte/store";
    import { fade, slide } from "svelte/transition";
    import { getDefault } from "$lib/Meetings/helpers.js";
    import Tooltip from "$lib/Builders/Tooltip.svelte";
    import { PUBLIC_DOMAIN, PUBLIC_MEETING_VERSION } from "$env/static/public";


    let client = getContext('client') as ReturnType<typeof firebaseClient>
    let bottom = getContext('bottom') as Writable<boolean>;
    let warning = getContext('warning') as Writable<Warning | undefined>;
    let dev = getContext('dev') as Writable<boolean>;

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

    let schedule = $page.url.searchParams.get("schedule");

    let today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setMilliseconds(0);

    let number = 50;
    let lastFetched = 0;
    let returned = true;
    let reachedEnd = data.reachedEnd;

    function loadNext() {
        if(unsubscribeClient) unsubscribeClient();

        unsubscribeClient = client.subscribe((user) => {
            try {
                if(user == undefined || 'preload' in user || user.team == undefined) return;

                const db = client.getFirestore();
                
                number += 25;

                if(order == 'Upcoming') {
                    const ref = query(collection(db, "teams", user.team, "meetings"), where("completed", "==", data.completed), where("starts", ">=", today), orderBy("starts"), limit(number));
                    startListener(ref);
                } else {
                    const ref = query(collection(db, "teams", user.team, "meetings"), where("completed", "==", data.completed), where("starts", "<", today), orderBy("starts", "desc"), limit(number));
                    startListener(ref);
                }
            } catch(e) {
                console.error(e);
            }
        });
    }

    let unsubscribeBottom: Unsubscriber | undefined = bottom.subscribe((isBottom) => {
        if(!browser) return;

        if(isBottom == true && returned == true && data.loading == false) {
            returned = false;

            loadNext();
        }

        if(isBottom == false && data.loading == false) {
            returned = true;
        }
    });

    onMount(() => {
        if(unsubscribeClient) unsubscribeClient();

        unsubscribeClient = client.subscribe((user) => {
            if(user == undefined || 'preload' in user || user.team == undefined) return;

            const db = client.getFirestore();

            const ref = query(collection(db, "teams", user.team, "meetings"), where("completed", "==", data.completed), where("starts", ">=", today), orderBy("starts"), limit(number), ...(schedule != null ? [ where("schedule", "==", schedule) ] : []));

            startListener(ref, true);
        })
    })

    onDestroy(() => {
        if(unsubscribeClient) unsubscribeClient();
        if(unsubscribeFirestore) unsubscribeFirestore();
        if(unsubscribeBottom) unsubscribeBottom();
    })

    function startListener(ref: Query<DocumentData>, intial: boolean = false) {
        if(reachedEnd && !intial) {
            return;
        }

        if(lastFetched == number) return;
        lastFetched = number;

        if(unsubscribeFirestore) unsubscribeFirestore();

        unsubscribeFirestore = onSnapshot(ref, async (snapshot) => {
            const firestoreMeetings = snapshot.docs;

            const meetings = new Array<typeof data.meetings[0]>();

            console.log(firestoreMeetings);

            for(let i = 0; i < firestoreMeetings.length; i++) {
                if(firestoreMeetings[i].data().version != PUBLIC_MEETING_VERSION) {
                    fetch('/meetings/' + firestoreMeetings[i].id + "/update");
                }

                meetings.push({
                    name: firestoreMeetings[i].data().name as string,
                    id: firestoreMeetings[i].id as string,
                    lead: await client.getUser(firestoreMeetings[i].data().lead.id) ?? getDefault(firestoreMeetings[i].data().lead.id),
                    synopsis: firestoreMeetings[i].data().synopsis == null ? getDefault("000000") : await client.getUser(firestoreMeetings[i].data().synopsis.id) ?? getDefault(firestoreMeetings[i].data().synopsis.id),
                    mentor: firestoreMeetings[i].data().mentor == null ? getDefault("000000") : await client.getUser(firestoreMeetings[i].data().mentor.id) ?? getDefault(firestoreMeetings[i].data().mentor.id),
                    location: firestoreMeetings[i].data().location as string,
                    thumbnail: firestoreMeetings[i].data().thumbnail as string,
                    starts: firestoreMeetings[i].data().starts.toDate() as Date,
                    ends: firestoreMeetings[i].data().ends.toDate() as Date,
                    role: firestoreMeetings[i].data().role != null ? await client.getRole(firestoreMeetings[i].data().role) ?? null : null,
                    signups: await Promise.all(Array.from(firestoreMeetings[i].data().signups, async (signup) => { return await client.getUser(signup as string) ?? getDefault("000000") })),
                    version: firestoreMeetings[i].data().version,
                    virtual: firestoreMeetings[i].data().virtual,
                    completed: firestoreMeetings[i].data().completed,
                    link: firestoreMeetings[i].data().link,
                    update: firestoreMeetings[i].data().update,
                    calendar: firestoreMeetings[i].data().calendar,
                    notion: firestoreMeetings[i].data().notion,
                    confirmations: firestoreMeetings[i].data().confirmations,
                });
            }

            data.meetingsShown = meetings.length;
            lastFetched = meetings.length;

            reachedEnd = meetings.length < number;

            data.meetings = meetings;
            data.loading = false;
        })
    }

    let order: "Upcoming" | "Recent" = "Upcoming";

    function changeOrder(newOrder: "Upcoming" | "Recent") {
        selected.reset();

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

                const ref = query(collection(db, "teams", user.team, "meetings"), where("completed", "==", data.completed), where("starts", ">=", today), orderBy("starts"), limit(number), ...(schedule != null ? [ where("schedule", "==", schedule) ] : []));
                startListener(ref);
            } else {
                order = newOrder;

                const ref = query(collection(db, "teams", user.team, "meetings"), where("completed", "==", data.completed), where("starts", "<", today), orderBy("starts", "desc"), limit(number), ...(schedule != null ? [ where("schedule", "==", schedule) ] : []));
                startListener(ref);
            }
        })
    }

    let selected = Select();
    let selectedMeetings: typeof data.meetings[0][] = [];
    let delayed = false;

    function Select() {
        const { set, update, subscribe } = writable<string[]>([]);

        const toggle = (id: string) => {
            const n = get({ subscribe });

            if(n.includes(id)) {
                update(n => {
                    for(let i = 0; i < n.length; i++) {
                        if(n[i] == id) {
                            n.splice(i, 1);
                            return n;
                        }
                    }

                    return n;
                })
            } else {
                update(n => {
                    n.push(id);

                    return n;
                });
            }
        }

        const reset = () => {
            set([]);
            selectedMeetings = [];
        }

        const actions = {
            leave: async () => {
                const n = get({ subscribe });

                for(let i = 0; i < n.length; i++) {
                    await remove(n[i], warning, client);
                }

                warning.set({
                    message: "Removed you from all selected meetings.",
                    color: 'green'
                })
            },
            signup: async () => {
                const n = get({ subscribe });

                for(let i = 0; i < n.length; i++) {
                    try {
                        await add(n[i], warning, client);
                    } catch(e) {
                        console.log(e);
                    }
                }

                warning.set({
                    message: "Added you to all selected meetings.",
                    color: 'green'
                })
            },
            delete: async () => {
                const n = get({ subscribe });

                await deleteMeetings(n, client);

                warning.set({
                    message: "Done deleting meetings.",
                    color: 'green'
                })

                reset();
            },
            duplicate: {
                start: async () => {
                    const n = get({ subscribe });

                    selectedMeetings = [];

                    for(let i = 0; i < n.length; i++) {
                        for(let j = 0; j < data.meetings.length; j++) {
                            if(data.meetings[j].id == n[i]) {
                                selectedMeetings.push(structuredClone(data.meetings[j]));
                            }
                        }
                    }

                    open = !open;
                },
                finish: async () => {
                    let meetings = new Array();

                    for(let i = 0; i < selectedMeetings.length; i++) {
                        meetings.push({
                            id: selectedMeetings[i].id,
                            starts: selectedMeetings[i].starts,
                            ends: selectedMeetings[i].ends,
                        })
                    }

                    delayed = true;

                    const res = await fetch("/meetings/add", {
                        method: 'PATCH',
                        headers: {
                            'content-type': 'application/json',
                        },
                        body: JSON.stringify({ meetings: meetings }),
                    })

                    let message = await res.json();

                    delayed = false;

                    warning.set({
                        message: message,
                        color: message == 'Meetings Duplicated!' ? 'green' : 'red',
                    })

                    if(message == 'Meetings Duplicated!') {
                        open = !open;
                        reset(); 
                    }
                },
                add: () => {
                    for(let i = 0; i < selectedMeetings.length; i++) {
                        let start = selectedMeetings[i].starts
                        let end = selectedMeetings[i].ends;

                        start.setDate(start.getDate() + 1);
                        end.setDate(end.getDate() + 1);

                        start = start;
                        end = end;
                    }

                    selectedMeetings = selectedMeetings;
                },
                remove: () => {
                    for(let i = 0; i < selectedMeetings.length; i++) {
                        let start = selectedMeetings[i].starts;
                        let end = selectedMeetings[i].ends;

                        start.setDate(start.getDate() - 1);
                        end.setDate(end.getDate() - 1);

                        start = start;
                        end = end;
                    }

                    selectedMeetings = selectedMeetings;
                }
            }
        }

        return {
            subscribe,
            reset,
            toggle,
            add,
            remove,
            actions,
        }
    }

    let leave = "";

    function gotoMeeting(id: string) {
        if($selected.length != 0) {
            selected.reset();

            leave = "/meetings/" + id;
        } else {
            goto("/meetings/" + id);
        }
    }

    function checkLeave() {
        if(leave != "") {
            goto(leave);
        }
    }



    function menuCheck() {
        if(!menu) return;

        let x = menu.getBoundingClientRect().y;

        maxheight = windowHeight - x;
    }


    let maxheight = 100000;
    let menu: HTMLElement;
    let windowHeight: number;



    let open = false;

    $: {
        if(!open) {
            selectedMeetings = [];
        }
    }

    function showTime(meetings: typeof data["meetings"], index: number) {
        if(index == 0) {
            return true;
        }

        if(index > meetings.length - 1) return false;

        const current = meetings[index];
        const previous = meetings[index - 1];

        return current.starts.getDate() != previous.starts.getDate() || current.starts.getMonth() != previous.starts.getMonth() || current.starts.getFullYear() != previous.starts.getFullYear();
    }

    function isToday(date: Date) {
        let today = new Date();

        return (!(date.getDate() != today.getDate() || date.getMonth() != today.getMonth() || date.getFullYear() != today.getFullYear()))
    }

    function includesSignup(signups: SecondaryUser[]) {
        if($client == undefined) return false;

        console.log(signups);

        for(let i = 0; i < signups.length; i++) {
            if(signups[i].id == $client.uid) {
                return true;
            }
        }

        return false;
    }
</script>

<svelte:head>
    <title>Skywalkers | {data.completed ? "Completed" : "Active"} Meetings</title>
</svelte:head>

<svelte:window on:scroll={menuCheck} on:resize={menuCheck} bind:innerHeight={windowHeight}></svelte:window>

<div class="min-h-[calc(100dvh-3rem)] lg:min-h-[calc(100dvh-3.5rem)] pt-[4.5rem] w-full bg-zinc-100 dark:bg-zinc-900 { !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('CREATE_MEETINGS')) ? "pb-[4.5rem] lg:pb-16" : ""} overflow-x-auto">
    <div class="p-4 pb-0 flex justify-between items-center">
        <p class="ml-1">Showing {data.meetingsShown} {order} Meeting{data.meetingsShown == 1 ? "" : "s"}</p>
        <div class="flex gap-2">
            <button on:click={() => { changeOrder('Upcoming') }} disabled={order == 'Upcoming'} class="{order == 'Upcoming' ? "b-secondary" : "b-secondary"} disabled:cursor-not-allowed">Upcoming</button>
            <button on:click={() => { changeOrder('Recent') }} disabled={order == 'Recent'} class="{order == 'Recent' ? "b-secondary" : "b-secondary"} disabled:cursor-not-allowed">Recent</button>
        </div>
    </div>
    <div class="p-4 pb-2">
        {#each data.meetings as meeting, i (meeting.id)}
            <div animate:flip>
                {#if showTime(data.meetings, i)}
                    <p class="mb-4 ml-1 {i == 0 ? "mt-0" : "mt-8"} opacity-80">
                        {#if isToday(data.meetings[i].starts)}
                            Today
                        {:else}
                            {format.format(meeting.starts, "dddd, MMMM DD")}
                        {/if}
                    </p>
                {/if}
            {#if meeting.version != PUBLIC_MEETING_VERSION}
                <div class="flex box-content bg-opacity-10 items-center w-full p-0 border-[1px] border-border-light dark:border-border-dark rounded-2xl md:rounded-full h-auto md:h-12 lg:h-[3.5rem] mb-2 transition-alloutline-2 outline -outline-offset-1 outline-transparent">
                    <div class="ml-4">
                        <div class="animate-spin">
                            <Icon style="transform: scaleX(-1);" scale=2rem icon="sync"/>
                        </div>
                    </div>
                    <div class="flex-grow-[1] flex flex-col md:flex-row md:items-center my-3 md:my-0 h-full gap-1 md:gap-0 w-full overflow-auto">
                        <p class="text-left lg:text-lg ml-4 whitespace-nowrap">Updating Meeting</p>
                    </div>
                </div>
            {:else}
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <button style="background-color: {meeting.role != null ? meeting.role.color + "1E" : "transparent" };" aria-roledescription="Meeting Listing, when clicked, goes to meeting listing, or gets selected if selecting meetings for action bar." on:click={() => { if($selected.length != 0) { selected.toggle(meeting.id); } else { goto("/meetings/" + meeting.id); }} } class="flex box-content bg-opacity-10 items-center w-full p-0 border-[1px] border-border-light dark:border-border-dark rounded-2xl md:rounded-full h-auto md:h-12 lg:h-[3.5rem] mb-2 transition-all {$selected.includes(meeting.id) ? "-outline-offset-1 outline-2 outline-blue-500 outline" : "outline-2 outline -outline-offset-1 outline-transparent"}">        
                    <div class="ml-4">
                        {#if meeting.thumbnail.startsWith("icon:")}
                            <Icon scale=2rem icon={meeting.thumbnail.substring(5, meeting.thumbnail.length)}/>
                        {/if}
                    </div>
                    <div class="flex-grow-[1] flex flex-col md:flex-row md:items-center my-3 md:my-0 h-full gap-1 md:gap-0 w-full md:overflow-auto overflow-hidden">
                        <p class="text-left lg:text-lg ml-4 whitespace-nowrap">{meeting.name}</p>
                        <div class="hidden md:block bg-border-light dark:bg-border-dark min-w-[1px] ml-3 -mr-1 h-4/6"></div>
                        <p class="text-left lg:text-lg ml-4 whitespace-nowrap">{meeting.location}</p>
                        <div class="hidden md:block bg-border-light dark:bg-border-dark min-w-[1px] ml-3 -mr-1 h-4/6"></div>
                        <p class="text-left lg:text-lg ml-4 whitespace-nowrap">{format.format(meeting.starts, "h:mm a")} - {format.format(meeting.ends, "h:mm a")}</p>
                        {#if meeting.role != null}
                            <div class="hidden md:block bg-border-light dark:bg-border-dark min-w-[1px] ml-3 mr-3 h-4/6"></div>
                            <div class="flex items-center gap-2 ml-4 md:ml-0">
                                <div style="background-color: {meeting.role.color};" class="h-4 w-4 rounded-full"></div>
                                <p class="text-left lg:text-lg -ml-0.5">{meeting.role.name}</p>
                            </div>
                        {/if}
                        {#if meeting.signups.length > 0}
                            <div class="block bg-border-light dark:bg-border-dark min-w-[1px] ml-3 mr-2 h-4/6"></div>
                            <div class="flex items-center gap-2 ml-3 sm:ml-4 md:ml-0 -my-1">
                                {#each meeting.signups as signup, i}
                                    <div class="bg-zinc-100 dark:bg-zinc-900 w-8 md:w-10 md:min-w-[2.5rem] min-w-[2rem] -mr-4 md:-mr-5 rounded-full">
                                        <Tooltip text="{signup.displayName}{signup.pronouns != "" ? " (" + signup.pronouns + ")" : ""}">
                                            <img style="border-color: {meeting.role != null ? meeting.role.color + "1E" : "transparent" };" class=" h-8 w-8 md:w-10 md:h-10 border-[4px]  rounded-full" alt="{signup.displayName}{signup.pronouns != "" ? " (" + signup.pronouns + ")" : ""}'s Profile" src={signup.photoURL}/>
                                        </Tooltip>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                    <Menu on:click={(e) => { e.stopPropagation(); }}>
                        <MenuButton on:click={(event) => { event.preventDefault(); event.stopPropagation();}} class="rounded-full b-clear transition h-8 w-8 lg:w-[2.5rem] lg:h-[2.5rem] mr-2 flex items-center justify-around bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10">
                            <Icon scale={0} class="text-[1.5rem] w-[1.5rem] h-[1.5rem] lg:text-[1.6rem] lg:w-[1.5rem] lg:h-[1.6rem]" rounded={true} icon=more_vert/>
                        </MenuButton>
                        <MenuItems>
                            <div style="max-height: {maxheight}px;" on:introstart={menuCheck} transition:slide={{ duration: 0, }} bind:this={menu} class="absolute z-10 right-6 max-w-[9.5rem] bg-backgroud-light dark:bg-backgroud-dark p-1.5 border-border-light dark:border-border-dark border-[1px] rounded-lg shadow-lg shadow-shadow-light dark:shadow-shadow-dark overflow-auto">
                                <MenuItem on:click={() => { gotoMeeting(meeting.id); }} class="flex items-center justify-between float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                                    Go to Page
                                    <Icon scale=1.15rem icon=description></Icon>
                                </MenuItem>
                                <MenuItem href="https://www.notion.so/{meeting.notion.replaceAll("-", "")}" class="flex items-center justify-between float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                                    Notion
                                    <Icon scale=1.15rem icon=open_in_new></Icon>
                                </MenuItem>
                                {#if !(meeting.role && !meeting.role.permissions.includes('LEAVE_SIGNUP')) || !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('MODERATE_MEETINGS'))}
                                    <MenuItem on:click={async (event) => { 
                                        event.preventDefault(); 
                                        event.stopPropagation(); 

                                        if(includesSignup(meeting.signups)) {
                                            await remove(meeting.id, warning, client);
                                        } else {
                                            await add(meeting.id, warning, client);
                                        }
                                    }} class="flex items-center justify-between float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                                        {#if includesSignup(meeting.signups)}
                                            Leave
                                            <Icon scale=1.15rem icon=close></Icon>
                                        {:else}
                                            Sign Up
                                            <Icon scale=1.15rem icon=done></Icon>
                                        {/if}
                                    </MenuItem>
                                {/if}
                                {#if !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('DELETE_MEETINGS')) || !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('CREATE_MEETINGS')) || !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('LEAVE_SIGNUP'))}
                                    <MenuItem on:click={(e) => { e.preventDefault(); e.stopPropagation(); selected.toggle(meeting.id); }} class="flex items-center justify-between float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                                        {#if $selected.includes(meeting.id)}
                                            Deselect
                                            <Icon scale=1.15rem icon=radio_button_checked></Icon>
                                        {:else}
                                            Select
                                            <Icon scale=1.15rem icon=radio_button_unchecked></Icon>
                                        {/if}
                                    </MenuItem>
                                {/if}
                                {#if !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('EDIT_MEETINGS'))}
                                    <MenuItem href="/meetings/{meeting.id}/edit" class="flex items-center justify-between float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                                        Edit
                                        <Icon scale=1.15rem icon=edit></Icon>
                                    </MenuItem>
                                {/if}
                                {#if !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('CREATE_MEETINGS'))}
                                    <MenuItem href="/meetings/{meeting.id}/duplicate" class="flex items-center justify-between float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                                        Duplicate
                                        <Icon scale=1.15rem icon=content_copy></Icon>
                                    </MenuItem>
                                {/if}
                                {#if !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('DELETE_MEETINGS'))}
                                    <MenuItem on:click={async (event) => {
                                        event.preventDefault(); 
                                        event.stopPropagation(); 

                                        await deleteMeeting(meeting.id, client);
                                    }} class="flex items-center justify-between float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                                        Delete      
                                        <Icon scale=1.15rem icon=delete></Icon>                     
                                    </MenuItem>
                                {/if}
                                {#if !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('DELETE_MEETINGS')) || meeting.lead || meeting.synopsis}
                                    <MenuItem href="/meetings/{meeting.id}/complete" class="flex items-center justify-between float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                                        Complete
                                        <Icon scale=1.15rem icon=double_arrow></Icon>
                                    </MenuItem>
                                {/if}
                                {#if $dev}
                                    <MenuItem target="_blank" href="https://console.firebase.google.com/u/0/project/frc-skywalkers{env ? "-dev" : ""}/firestore/data/~2Fteams~2F{$client?.team}~2Fmeetings~2F{meeting.id}" class="flex items-center justify-between float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                                        Firebase
                                        <Icon scale=1.15rem icon=terminal></Icon>
                                    </MenuItem>
                                    <MenuItem on:click={(e) => { navigator.clipboard.writeText(meeting.id); }} class="flex items-center justify-between float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                                        Copy ID
                                        <Icon scale=1.15rem icon=content_copy></Icon>
                                    </MenuItem>
                                    <MenuItem class="flex items-center justify-between float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                                        <p>Version</p>
                                        <p>{meeting.version}</p>
                                    </MenuItem>
                                {/if}
                            </div>
                        </MenuItems>
                    </Menu>
                </button>
            {/if}
            </div>
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

{#if !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('CREATE_MEETINGS')) && !data.completed}
    <a href="/meetings/add" class="-mt-[58px] mr-4 mb-0 sticky float-right items-center bottom-16 lg:bottom-[4.25rem] px-4 pr-5 py-3 bg-backgroud-light flex dark:bg-backgroud-dark border-[1px] border-border-light dark:border-border-dark rounded-full shadow-lg shadow-shadow-light dark:shadow-shadow-dark hover:brightness-[95%] transition w-fit">
        <Icon class="mr-1" scale=2rem icon=add></Icon>
        <p class="text-lg">Create Meeting</p>
    </a>
{/if}

{#if $selected.length == 0}
    <div transition:slide|local class="h-12 lg:h-14 sticky z-[5] bottom-0 border-border-light dark:border-border-dark border-t-[1px] bg-backgroud-light dark:bg-backgroud-dark w-full flex px-1.5 gap-1.5">
        <svelte:element this={data.completed ? "a" : "div"} href={data.completed ? "/meetings" : undefined} class="w-full text-center lg:text-lg my-1.5 rounded-md {data.completed ? "bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10" : "bg-accent-500 text-black text-dcursor-not-allowed"} transition flex justify-around items-center">
            Active
        </svelte:element>
        <svelte:element this={data.completed ? "div" : "a"} href={data.completed ? undefined : "/meetings/completed/1"} class="w-full lg:text-lg  text-center my-1.5 rounded-md {!data.completed ? "bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10" : "bg-accent-500 text-black text-dcursor-not-allowed"} transition flex justify-around items-center">
            Completed
        </svelte:element>
    </div>  
{:else}
    <div on:outroend={() => { checkLeave(); }} transition:slide|local class="h-12 lg:h-14 sticky z-[5] bottom-0 border-border-light dark:border-border-dark border-t-[1px] bg-backgroud-light dark:bg-backgroud-dark overflow-auto">
        <div class="flex px-1.5 gap-1.5 h-full">
            {#if !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('DELETE_MEETINGS'))}
                <button on:click={selected.actions.delete} class="w-full min-w-[150px] text-center lg:text-lg my-1.5 rounded-md bg-red-500 dark:bg-red-500 bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition flex justify-around items-center">
                    <div class="flex items-center text-red-500">   
                        <Icon icon=delete></Icon>
                        <p class="ml-1">Delete</p>
                    </div>
                </button>
            {/if}
            {#if !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('CREATE_MEETINGS'))}
                <button on:click={selected.actions.duplicate.start} class="w-full min-w-[150px] text-center lg:text-lg my-1.5 rounded-md bg-blue-500 dark:bg-blue-500 bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition flex justify-around items-center">
                    <div class="flex items-center text-blue-500">   
                        <Icon icon=content_copy></Icon>
                        <p class="ml-1">Duplicate</p>
                    </div>
                </button>
            {/if}
            {#if !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('LEAVE_SIGNUP'))}
                <button on:click={selected.actions.signup} class="w-full min-w-[150px] text-center lg:text-lg my-1.5 rounded-md bg-green-500 dark:bg-green-500 bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition flex justify-around items-center">
                    <div class="flex items-center text-green-500">   
                        <Icon icon=event_available></Icon>
                        <p class="ml-1">Sign Up</p>
                    </div>
                </button>
                <button on:click={selected.actions.leave} class="w-full min-w-[150px] text-center lg:text-lg my-1.5 rounded-md bg-orange-500 dark:bg-orange-500 bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition flex justify-around items-center">
                    <div class="flex items-center text-orange-500">   
                        <Icon icon=event_busy></Icon>
                        <p class="ml-1">Leave</p>
                    </div>
                </button>
            {/if}
            <button on:click={selected.reset} class="w-full min-w-[150px] text-center lg:text-lg my-1.5 rounded-md bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition flex justify-around items-center">
                <div class="flex items-center">   
                    <Icon icon=cancel></Icon>
                    <p class="ml-1">Reset</p>
                </div>
            </button>
        </div>
    </div>
{/if}

<Dialog width=35rem bind:isOpen={open}>
    <h1 class="text-2xl" slot=title>Duplicate Meeting(s)</h1>

    <div slot=content>
        <Line class="my-4"></Line>
        <div class="flex flex-col gap-3 overflow-x-scroll -mt-1">
            <div class="flex flex-row-reverse">
                <div class="flex items-center gap-2">
                    <p>Adjust all times: </p>
                    <button class="b-accent" on:click={selected.actions.duplicate.remove}><Icon icon=arrow_back></Icon></button>
                    <button class="b-accent" on:click={selected.actions.duplicate.add}><Icon icon=arrow_forward></Icon></button>
                </div>
            </div>
            {#each selectedMeetings as meeting}
                <div class="flex flex-col gap-2 sm:flex-row sm:items-center ">
                    <p class="whitespace-nowrap overflow-hidden overflow-ellipsis mr-1.5 w-full text-lg min-w-[120px]">{meeting.name}: </p>
                    <div class="flex gap-1 items-center min-w-[280px] max-w-[75%]">
                        <DatePicker bind:startTime={meeting.starts} bind:endTime={meeting.ends} let:openDialog>
                            <p class="w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700">{format.format(meeting.starts, "ddd, MMM DD")}: {format.format(meeting.starts, "h:mm a")} - {format.format(meeting.ends, "h:mm a")}</p>
                            <button class="-ml-[1.5rem] -translate-x-[0.3rem]" on:click={(e) => { e.preventDefault(); openDialog(); }}>
                                <Icon scale=1.25rem icon=schedule></Icon>
                            </button>   
                        </DatePicker>             
                    </div>
                </div>
            {/each}
        </div>
        <Line class="my-4"></Line>
        <div class="flex flex-row-reverse gap-2">
            <button disabled={delayed} on:click={selected.actions.duplicate.finish} class="b-green disabled:opacity-75 disabled:cursor-not-allowed">Duplicate</button>
            <button on:click={() => { open = !open; }} class="b-default">Cancel</button>
            {#if delayed}
                <div class="scale-75 flex items-center h-[2.125rem] overflow-hidden">
                    <Loading></Loading>
                </div>
            {/if}
        </div>
    </div>
</Dialog>