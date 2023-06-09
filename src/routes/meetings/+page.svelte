<script>

import Icon from "$lib/Builders/Icon.svelte";
</script>

<div class="p-4 flex-col gap-4 min-h-[calc(100dvh-4rem)]">
    <button class="flex box-content items-center w-full h-12 p-0 border-[1px] border-border-light dark:border-border-dark rounded-full">
        <div class="ml-4">
            <Icon scale=2rem icon=build/>
        </div>
        <div class="flex-grow-[1] flex items-center h-full">
            <p class="text-left ml-4">Clean up garage</p>
            <div class="bg-border-light dark:bg-border-dark w-[1px] ml-3 -mr-1 h-4/6"></div>
            <p class="text-left ml-4">At: Raghu Uncle's Garage</p>
            <div class="bg-border-light dark:bg-border-dark w-[1px] ml-3 -mr-1 h-4/6"></div>
            <p class="text-left ml-4">This Friday</p>
        </div>
        <button class="rounded-full b-clear transition h-8 w-8 mr-2 flex items-center justify-around bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10">
            <Icon scale=1.25rem rounded={true} icon=more_vert/>
        </button>
    </button>
</div>