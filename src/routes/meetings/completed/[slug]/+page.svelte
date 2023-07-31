<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import { Menu, MenuButton, MenuItem, MenuItems } from "@rgossiaux/svelte-headlessui";
    import format from "date-and-time";
    import meridiem from 'date-and-time/plugin/meridiem';
    import { getContext } from "svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase.js";
    import { flip } from "svelte/animate";
    import { goto } from "$app/navigation";

    format.plugin(meridiem);

    export let data;
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
            <a animate:flip href="/meetings/{meeting.id}" class="flex box-content items-center w-full p-0 border-[1px] border-border-light dark:border-border-dark rounded-2xl md:rounded-full h-auto md:h-12 lg:h-[3.5rem] mb-2">
                <div class="ml-4">
                    {#if meeting.thumbnail.startsWith("icon:")}
                        <Icon scale=2rem icon={meeting.thumbnail.substring(5, meeting.thumbnail.length)}/>
                    {/if}
                </div>
                <div class="flex-grow-[1] flex flex-col md:flex-row md:items-center my-3 md:my-0 h-full gap-1 md:gap-0">
                    <p class="text-left lg:text-lg ml-4">{meeting.name}</p>
                    <div class="hidden md:block bg-border-light dark:bg-border-dark w-[1px] ml-3 -mr-1 h-4/6"></div>
                    <p class="text-left lg:text-lg ml-4">At: {meeting.location}</p>
                    <div class="hidden md:block bg-border-light dark:bg-border-dark w-[1px] ml-3 -mr-1 h-4/6"></div>
                    <p class="text-left lg:text-lg ml-4">{format.format(meeting.when_start, "M/D/YY, h:mm a")} - {format.format(meeting.when_end, "h:mm a")}</p>
                </div>
                <Menu>
                    <MenuButton on:click={(event) => { event.preventDefault(); event.stopPropagation();}} class="rounded-full b-clear transition h-8 w-8 lg:w-[2.5rem] lg:h-[2.5rem] mr-2 flex items-center justify-around bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10">
                        <Icon scale={0} class="text-[1.5rem] w-[1.5rem] h-[1.5rem] lg:text-[1.6rem] lg:w-[1.5rem] lg:h-[1.6rem]" rounded={true} icon=more_vert/>
                    </MenuButton>
                    <MenuItems class="absolute z-10 right-6 max-w-[8rem] bg-backgroud-light dark:bg-backgroud-dark p-1.5 border-border-light dark:border-border-dark border-[1px] rounded-lg shadow-lg shadow-shadow-light dark:shadow-shadow-dark">
                        <MenuItem href="/meetings/{meeting.id}/duplicate" class="float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                            Duplicate
                        </MenuItem>
                        <MenuItem href="/synopsis/{meeting.id}/" class="float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                            Synopsis
                        </MenuItem>
                    </MenuItems>
                </Menu>
            </a>
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

<div class="h-12 lg:h-14 sticky z-[5] bottom-0 border-border-light dark:border-border-dark border-t-[1px] bg-backgroud-light dark:bg-backgroud-dark w-full flex px-1.5 gap-1.5">
    <svelte:element this={data.completed ? "a" : "div"} href={data.completed ? "/meetings" : undefined} class="w-full text-center lg:text-lg my-1.5 rounded-md {data.completed ? "bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10" : "bg-accent-light dark:bg-accent-dark dark:text-accent-text-dark text-accent-text-light text-dcursor-not-allowed"} transition flex justify-around items-center">
        Active
    </svelte:element>
    <svelte:element this={data.completed ? "div" : "a"} href={data.completed ? undefined : "/meetings/completed"} class="w-full lg:text-lg  text-center my-1.5 rounded-md {!data.completed ? "bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10" : "bg-accent-light dark:bg-accent-dark dark:text-accent-text-dark text-accent-text-light text-dcursor-not-allowed"} transition flex justify-around items-center">
        Completed
    </svelte:element>
</div>