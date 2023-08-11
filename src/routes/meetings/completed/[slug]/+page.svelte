<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import { Menu, MenuButton, MenuItem, MenuItems } from "@rgossiaux/svelte-headlessui";
    import format from "date-and-time";
    import meridiem from 'date-and-time/plugin/meridiem';
    import { getContext } from "svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase.js";
    import { flip } from "svelte/animate";
    import { goto } from "$app/navigation";
    import { get, writable, type Writable } from "svelte/store";
    import type { Warning } from "$lib/stores.js";
    import Dialog from "$lib/Builders/Dialog.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import DateTimeInput from "$lib/Components/DateTimeInput.svelte";
    import TimeInput from "$lib/Components/TimeInput.svelte";
    import Loading from "$lib/Builders/Loading.svelte";
    import { slide } from "svelte/transition";
    import { onDestroy } from "svelte";
    import { page } from "$app/stores";
    import Role from "$lib/Components/Role.svelte";
    import Ellipse from "$lib/Builders/Ellipse.svelte";

    format.plugin(meridiem);

    export let data;

    let client = getContext('client') as ReturnType<typeof firebaseClient>;
    let warning = getContext('warning') as Writable<Warning | undefined>;

    let selected = Select();
    let selectedMeetings: typeof data.meetings[0][] = [];
    let delayed = false;

    let open = false;

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
            duplicate: {
                start: async () => {
                    const n = get({ subscribe });

                    for(let i = 0; i < n.length; i++) {
                        for(let j = 0; j < data.meetings.length; j++) {
                            if(data.meetings[j].id == n[i]) {
                                selectedMeetings.push(data.meetings[j]);
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
                            starts: selectedMeetings[i].when_start,
                            ends: selectedMeetings[i].when_end,
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
                    }

                    reset();
                }
            }
        }

        return {
            subscribe,
            reset,
            toggle,
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


    onDestroy(() => {
        pageLeave();
    })

    $: pageLeave($page)

    function pageLeave(a: any = undefined) {
        selected.reset();
    }
</script>

<svelte:head>
    <title>Skywalkers | {data.completed ? "Completed" : "Active"} Meetings</title>
</svelte:head>

<div class="min-h-[calc(100dvh-7rem)] lg:min-h-[calc(100dvh-7.5rem)] w-full bg-zinc-100 dark:bg-zinc-900 overflow-x-auto">
    <div class="p-4 pb-0 flex justify-between items-center">
        <p class="ml-1">Showing {data.page.showing} / {data.page.total.count} Completed Meetings</p>
        <div class="flex gap-2 ml-4">
            <svelte:element this={data.page.beginning ? "button" : "a"} disabled={data.page.beginning}  href="/meetings/completed/1"  class="b-primary disabled:opacity-50 rotate-180"><Icon icon=double_arrow></Icon></svelte:element>
            <svelte:element this={data.page.beginning ? "button" : "a"} disabled={data.page.beginning}  href="/meetings/completed/{data.page.on - 1}"  class="b-primary disabled:opacity-50"><Icon icon=arrow_back></Icon></svelte:element>
            <svelte:element this={data.page.end ? "button" : "a"} disabled={data.page.end} href="/meetings/completed/{data.page.on + 1}" class="b-primary disabled:opacity-50"><Icon icon=arrow_forward></Icon></svelte:element>
            <svelte:element this={data.page.end ? "button" : "a"} disabled={data.page.end}  href="/meetings/completed/{data.page.total.pages}"  class="b-primary disabled:opacity-50"><Icon icon=double_arrow></Icon></svelte:element>
        </div>
    </div>
    <div class="p-4 pb-2">
        {#each data.meetings as meeting (meeting.id)}
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <svelte:element aria-roledescription="Meeting Listing, when clicked, goes to meeting listing, or gets selected if selecting meetings for action bar." this={$selected.length == 0 ? "a" : "button"} animate:flip on:click={() => { if($selected.length != 0) { selected.toggle(meeting.id); } }} href="/meetings/{meeting.id}" class="flex box-content items-center w-full p-0 border-[1px] border-border-light dark:border-border-dark rounded-2xl md:rounded-full h-auto md:h-12 lg:h-[3.5rem] mb-2 transition-all {$selected.includes(meeting.id) ? "-outline-offset-1 outline-2 outline-blue-500 outline" : "outline-2 outline -outline-offset-1 outline-transparent"}">
                <div class="ml-4">
                    {#if meeting.thumbnail.startsWith("icon:")}
                        <Icon scale=2rem icon={meeting.thumbnail.substring(5, meeting.thumbnail.length)}/>
                    {/if}
                </div>
                <div class="flex-grow-[1] flex flex-col md:flex-row md:items-center my-3 md:my-0 h-full gap-1 md:gap-0 w-full overflow-auto">
                    <p class="text-left lg:text-lg ml-4 whitespace-nowrap">{meeting.name}</p>
                    <div class="hidden md:block bg-border-light dark:bg-border-dark min-w-[1px] ml-3 -mr-1 h-4/6"></div>
                    <p class="text-left lg:text-lg ml-4 whitespace-nowrap">At: {meeting.location}</p>
                    <div class="hidden md:block bg-border-light dark:bg-border-dark min-w-[1px] ml-3 -mr-1 h-4/6"></div>
                    <p class="text-left lg:text-lg ml-4 whitespace-nowrap">{format.format(meeting.when_start, "M/D/YY, h:mm a")} - {format.format(meeting.when_end, "h:mm a")}</p>
                    {#if typeof meeting.role != 'boolean'}
                        <div class="hidden md:block bg-border-light dark:bg-border-dark min-w-[1px] ml-3 -mr-1 h-4/6"></div>
                        <Role id={meeting.role} let:role>
                            {#await role}
                                <p class="text-left lg:text-lg ml-4">Loading<Ellipse/></p>  
                            {:then role}
                                <div class="flex items-center gap-2">
                                    <p class="text-left lg:text-lg ml-4">Group:</p>
                                    <div style="background-color: {role.color};" class="h-4 w-4 rounded-full"></div>
                                    <p class="text-left lg:text-lg -ml-0.5">{role.name}</p>
                                </div>
                            {/await}
                        </Role>
                    {/if}
                </div>
                <Menu>    
                    <MenuButton on:click={(event) => { event.preventDefault(); event.stopPropagation();}} class="rounded-full b-clear transition h-8 w-8 lg:w-[2.5rem] lg:h-[2.5rem] mr-2 flex items-center justify-around bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10">
                        <Icon scale={0} class="text-[1.5rem] w-[1.5rem] h-[1.5rem] lg:text-[1.6rem] lg:w-[1.5rem] lg:h-[1.6rem]" rounded={true} icon=more_vert/>
                    </MenuButton>
                    <MenuItems class="absolute z-10 right-6 max-w-[8rem] bg-backgroud-light dark:bg-backgroud-dark p-1.5 border-border-light dark:border-border-dark border-[1px] rounded-lg shadow-lg shadow-shadow-light dark:shadow-shadow-dark">
                        <MenuItem on:click={() => { gotoMeeting(meeting.id); }} class="float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                            Go to Page
                        </MenuItem>
                        <MenuItem href="/synopsis/{meeting.id}/" class="float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                            Synopsis
                        </MenuItem>
                        {#if !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('CREATE_MEETINGS'))}
                                <MenuItem on:click={(e) => { e.preventDefault(); e.stopPropagation(); selected.toggle(meeting.id); }} class="float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                                    {#if $selected.includes(meeting.id)}
                                        Deselect
                                    {:else}
                                        Select
                                    {/if}
                                </MenuItem>
                            {/if}
                        {#if !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('CREATE_MEETINGS'))}
                            <MenuItem href="/meetings/{meeting.id}/duplicate" class="float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                                Duplicate
                            </MenuItem>
                        {/if}
                    </MenuItems>
                </Menu>
            </svelte:element>
        {:else}
            <div class="w-screen absolute left-0 flex justify-around pt-8">
                <p class="text-2xl text-red-500 dark:text-red-500 font-bold">No Meetings Found</p>
            </div>
        {/each}
    </div>
    {#if data.meetings.length != 0}
        <div class="flex justify-around md:block md:float-right p-4 pt-0">
            <div class="flex gap-2 items-center">
                <svelte:element this={data.page.beginning ? "button" : "a"} disabled={data.page.beginning}  href="/meetings/completed/1"  class="b-primary disabled:opacity-50 rotate-180"><Icon icon=double_arrow></Icon></svelte:element>
                <svelte:element this={data.page.beginning ? "button" : "a"} disabled={data.page.beginning}  href="/meetings/completed/{data.page.on - 1}"  class="b-primary disabled:opacity-50"><Icon icon=arrow_back></Icon></svelte:element>
                <p class="mx-2">{data.page.showing} / {data.page.total.count}</p>
                <svelte:element this={data.page.end ? "button" : "a"} disabled={data.page.end} href="/meetings/completed/{data.page.on + 1}" class="b-primary disabled:opacity-50"><Icon icon=arrow_forward></Icon></svelte:element>
                <svelte:element this={data.page.end ? "button" : "a"} disabled={data.page.end}  href="/meetings/completed/{data.page.total.pages}"  class="b-primary disabled:opacity-50"><Icon icon=double_arrow></Icon></svelte:element>
            </div>
        </div>
    {/if}
</div>

{#if !data.completed}
<a href="/meetings/add" class="-mt-[58px] mr-4 mb-0 sticky float-right items-center bottom-16 lg:bottom-[4.25rem] px-4 pr-5 py-3 bg-backgroud-light flex dark:bg-backgroud-dark border-[1px] border-border-light dark:border-border-dark rounded-full shadow-lg shadow-shadow-light dark:shadow-shadow-dark hover:brightness-[95%] transition w-fit">
        <Icon class="mr-1" scale=2rem icon=add></Icon>
        <p class="text-lg">Create Meeting</p>
    </a>
{/if}

{#if $selected.length == 0}
    <div transition:slide|local class="h-12 lg:h-14 sticky z-[5] bottom-0 border-border-light dark:border-border-dark border-t-[1px] bg-backgroud-light dark:bg-backgroud-dark w-full flex px-1.5 gap-1.5">
        <svelte:element this={data.completed ? "a" : "div"} href={data.completed ? "/meetings" : undefined} class="w-full text-center lg:text-lg my-1.5 rounded-md {data.completed ? "bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10" : "bg-accent-light dark:bg-accent-dark dark:text-accent-text-dark text-accent-text-light text-dcursor-not-allowed"} transition flex justify-around items-center">
            Active
        </svelte:element>
        <svelte:element this={data.completed ? "div" : "a"} href={data.completed ? undefined : "/meetings/completed/1"} class="w-full lg:text-lg  text-center my-1.5 rounded-md {!data.completed ? "bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10" : "bg-accent-light dark:bg-accent-dark dark:text-accent-text-dark text-accent-text-light text-dcursor-not-allowed"} transition flex justify-around items-center">
            Completed
        </svelte:element>
    </div>
{:else}
    <div on:outroend={() => { checkLeave(); }} transition:slide|local class="h-12 lg:h-14 sticky z-[5] bottom-0 border-border-light dark:border-border-dark border-t-[1px] bg-backgroud-light dark:bg-backgroud-dark overflow-auto">
        <div class="flex px-1.5 gap-1.5 h-full">
            {#if !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('CREATE_MEETINGS'))}
                <button on:click={selected.actions.duplicate.start} class="w-full min-w-[150px] text-center lg:text-lg my-1.5 rounded-md bg-blue-500 dark:bg-blue-500 bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition flex justify-around items-center">
                    <div class="flex items-center text-blue-500">   
                        <Icon icon=content_copy></Icon>
                        <p class="ml-1">Duplicate</p>
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

<Dialog width=40rem bind:isOpen={open}>
    <h1 class="text-2xl" slot=title>Duplicate Meeting(s)</h1>

    <div slot=content>
        <Line class="my-4"></Line>
        <div class="flex flex-col gap-3 overflow-x-scroll">
            {#each selectedMeetings as meeting}
                <div class="flex flex-col gap-2 sm:flex-row sm:items-center ">
                    <p class="whitespace-nowrap overflow-hidden overflow-ellipsis mr-1.5 w-full text-lg min-w-[120px]">{meeting.name}: </p>
                    <div class="flex items-center">
                        <DateTimeInput name=time bind:date={meeting.when_start} class="w-[215px] min-w-[215px] rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"/>
                        <p class="mx-1"> - </p>
                        <TimeInput name=time bind:date={meeting.when_end} class="w-[120px] min-w-[120px] rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"/>
                    </div>
                </div>
            {/each}
        </div>
        <Line class="my-4"></Line>
        <div class="flex flex-row-reverse gap-2">
            <button on:click={selected.actions.duplicate.finish} class="b-green">Duplicate</button>
            <button on:click={() => { open = !open; }} class="b-default">Cancel</button>
            {#if delayed}
                <div class="scale-75 flex items-center h-[2.125rem] overflow-hidden">
                    <Loading></Loading>
                </div>
            {/if}
        </div>
    </div>
</Dialog>