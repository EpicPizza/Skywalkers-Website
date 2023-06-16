<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import { Menu, MenuButton, MenuItem, MenuItems } from "@rgossiaux/svelte-headlessui";
    import Loading from "$lib/Builders/Loading.svelte";
    import Time from "$lib/Builders/Time.svelte";
    import format from "date-and-time";
    import meridiem from 'date-and-time/plugin/meridiem';

    format.plugin(meridiem);

    export let data;
</script>

<div class="min-h-[calc(100dvh-7rem)] w-full overflow-x-scroll">
    <div class="min-w-[640px]">
        <div class="p-4 pb-2">
            {#each data.meetings as meeting}
                <a href="/meetings/{meeting.id}" class="flex box-content items-center w-full p-0 border-[1px] border-border-light dark:border-border-dark rounded-full h-12 mb-2">
                    <div class="ml-4">
                        {#if meeting.thumbnail.startsWith("icon:")}
                            <Icon scale=2rem icon={meeting.thumbnail.substring(5, meeting.thumbnail.length)}/>
                        {/if}
                    </div>
                    <div class="flex-grow-[1] flex items-center h-full">
                        <p class="text-left ml-4">{meeting.name}</p>
                        <div class="bg-border-light dark:bg-border-dark w-[1px] ml-3 -mr-1 h-4/6"></div>
                        <p class="text-left ml-4">At: {meeting.location}</p>
                        <div class="bg-border-light dark:bg-border-dark w-[1px] ml-3 -mr-1 h-4/6"></div>
                        <p class="text-left ml-4">{format.format(meeting.when_start, "M/D, h:mm a")} - {format.format(meeting.when_end, "h:mm a")}</p>
                    </div>
                    <Menu>
                        <MenuButton on:click={(event) => { event.preventDefault(); event.stopPropagation();}} class="rounded-full b-clear transition h-8 w-8 mr-2 flex items-center justify-around bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10">
                            <Icon scale=1.25rem rounded={true} icon=more_vert/>
                        </MenuButton>
                        <MenuItems class="absolute right-6 bg-backgroud-light dark:bg-backgroud-dark p-1.5 border-border-light dark:border-border-dark border-[1px] rounded-lg shadow-lg shadow-shadow-light dark:shadow-shadow-dark w-32">
                            <MenuItem href="/meetings/{meeting.id}/edit" class="float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                                Edit
                            </MenuItem>
                            <MenuItem on:click={(event) => { event.preventDefault(); event.stopPropagation(); }} class="float-left px-2 py-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition w-full text-left rounded-md">
                                Sign up
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
    </div>
</div>

{#if !data.completed}
    <a href="/meetings/add" class="m-4 absolute flex items-center bottom-12 right-0 px-4 pr-5 py-3 bg-backgroud-light dark:bg-backgroud-dark border-[1px] border-border-light dark:border-border-dark rounded-full shadow-lg shadow-shadow-light dark:shadow-shadow-dark hover:brightness-[95%] transition">
        <Icon class="mr-1" scale=2rem icon=add></Icon>
        <p class="text-lg">Create Meeting</p>
    </a>
{/if}

<div class="h-12 sticky z-10 bottom-0 border-border-light dark:border-border-dark border-t-[1px] bg-backgroud-light dark:bg-backgroud-dark w-full flex px-1.5 gap-1.5">
    <a href=/meetings class="w-full text-center my-1.5 rounded-md bg-black dark:bg-white {data.completed ? "bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10" : "bg-opacity-20 dark:bg-opacity-20 cursor-not-allowed"} transition flex justify-around items-center">
        Active
    </a>
    <a href="/meetings?completed=true" class="w-full text-center my-1.5 rounded-md bg-black dark:bg-white {data.completed ? "bg-opacity-20 dark:bg-opacity-20 cursor-not-allowed" : "bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10"} transition flex justify-around items-center">
        Completed
    </a>
</div>