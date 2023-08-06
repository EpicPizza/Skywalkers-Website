<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import MiniProfile from "$lib/Components/MiniProfile.svelte";
    import format from "date-and-time";
    import meridiem from "date-and-time/plugin/meridiem";

    export let data;

    format.plugin(meridiem);
</script>

<div class="min-h-[calc(100dvh-4rem)] p-8 flex justify-around">
    <div class="w-[36rem] lg:w-[44rem]">
        <div class="w-full flex justify-between">
            <button on:click={() => { history.back(); }} class="flex gap-1 p-1 mb-2 pr-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition lg:text-lg">
                <Icon scale={0} class="text-[1.25rem] w-[1.25rem] h-[1.25rem] lg:text-[1.5rem] lg:w-[1.5rem] lg:h-[1.5rem]" icon=arrow_back></Icon>
                <p>Back</p>
            </button>
        </div>
        <Line class="mb-4"></Line>
        <h1 class="text-xl lg:text-3xl mb-4 lg:mb-6">Reject Synopsis:</h1>
        <div class="opacity-75 flex items-center mb-4 lg:mb-6">
            <Icon scale={0}  class="text-[1.5rem] w-[1.5rem] h-[1.5rem] lg:text-[1.75rem] lg:w-[1.75rem] lg:h-[1.75rem] mb-auto" icon=info></Icon>
            <p class="ml-2 lg:text-lg">By rejecting the synopsis of {data.meeting.name}, you will be deleting it's synopsis and it's attachments forever. The linked meeting will also be marked as active again. (Synopsis might still remain in discord, however images and files will be deleted.)</p>
        </div>
        <form method=POST>
            <button class="b-red lg:p-1 lg:px-2 lg:text-lg">Reject</button>
        </form>
    </div>
</div>