<script lang=ts>
    import Error from "$lib/Builders/Error.svelte";
import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Loading from "$lib/Builders/Loading.svelte";
    import MiniProfile from "$lib/Components/MiniProfile.svelte";
    import format from "date-and-time";
    import meridiem from "date-and-time/plugin/meridiem";
    import { superForm } from "sveltekit-superforms/client";

    export let data;

    format.plugin(meridiem);

    let { tainted, capture, restore, form, enhance, allErrors, message, delayed } = superForm(data.form, { dataType: 'json' });

    function middleManRestore(arg: any) {
        restore(arg as any);

        $tainted = { synopsis: $form.synopsis.length > 0 };
    }

    export const snapshot = { capture, restore: middleManRestore };
</script>

<div class="min-h-[calc(100dvh-4rem)] p-8 flex justify-around">
    <div class="w-[36rem] lg:w-[44rem]">
        <div class="w-full flex justify-between">
            <button on:click={() => { history.back() }} class="flex gap-1 p-1 mb-2 pr-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition lg:text-lg">
                <Icon scale={0} class="text-[1.25rem] w-[1.25rem] h-[1.25rem] lg:text-[1.5rem] lg:w-[1.5rem] lg:h-[1.5rem]" icon=arrow_back></Icon>
                <p>Back</p>
            </button>
            <button on:click={() => {
                $tainted = undefined;

                history.back();
            }} class="flex gap-1 p-1 mb-2 pr-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition lg:text-lg">
                <Icon scale={0} class="text-[1.25rem] w-[1.25rem] h-[1.25rem] lg:text-[1.5rem] lg:w-[1.5rem] lg:h-[1.5rem]" icon=cancel></Icon>
                <p>Cancel</p>
            </button>
        </div>
        <Line class="mb-4"></Line>
        <h1 class="text-2xl lg:text-3xl pb-4">Complete Meeting:</h1>
        <div class="p-4 border-border-light dark:border-border-dark border-[1px] rounded-3xl">
            <div class="p-4 lg:p-6 bg-accent-light dark:bg-accent-dark text-accent-text-light dark:text-accent-text-dark rounded-2xl flex items-center">
                {#if data.meeting.thumbnail.startsWith("icon:")}
                    <Icon scale={0} class="text-[4rem] w-[4rem] h-[4rem] lg:text-[5rem] lg:w-[5rem] lg:h-[5rem]" icon={data.meeting.thumbnail.substring(5, data.meeting.thumbnail.length)}/>
                {/if}
                <div class="ml-4 lg:ml-5 grow">
                    <div class="text-2xl lg:text-3xl lg:mb-1">{data.meeting.name}</div>
                    <div class="text-lg lg:text-xl opacity-80">At {data.meeting.location}</div>
                </div>
                <a href="/meetings/{data.meeting.id}/edit?redirect=completed" class="mb-auto">
                    <button on:click={() => { $tainted = {}; }}>
                        <Icon icon=edit class="text-[1.75rem] w-[1.75rem] h-[1.75rem] lg:text-[2.25rem] lg:w-[2.25rem] lg:h-[2.25rem]" scale={0}></Icon>
                    </button>
                </a>
            </div>
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
        </div>  
        <form method=POST use:enhance>
            <div class="mt-8 items-center w-full">
                <div class="flex justify-between">
                    <p class="text-lg lg:text-xl mb-3">Synopsis:</p>
                    <p class="lg:text-lg mt-auto mb-3 {$form.synopsis.length > 10000 ? "text-red-500 dark:text-red-500 font-bold" : "opacity-50"}">{$form.synopsis.length}/10000</p>
                </div>
                <textarea name=synopsis bind:value={$form.synopsis} class="p-5 lg:text-lg w-full rounded-3xl bg-zinc-200 dark:bg-zinc-700 h-52"/>
            </div>
            <Error {allErrors} {message}></Error>
            <div class="flex items-center mt-6 gap-4">
                <button class="b-primary lg:p-1 lg:px-2 lg:text-lg flex items-center gap-1">
                    <Icon scale=1.25rem icon=save></Icon>
                    <p class="text-inherit">Save</p>
                </button>
                {#if $delayed}
                    <Loading></Loading>
                {/if}
            </div>
        </form>
    </div>
</div>