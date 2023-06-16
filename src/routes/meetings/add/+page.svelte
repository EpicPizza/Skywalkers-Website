<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Loading from "$lib/Builders/Loading.svelte";
    import TimeInput from "$lib/Components/TimeInput.svelte";
    import IconChooser from "$lib/Components/IconChooser.svelte";
    import PersonChooser from "$lib/Components/PersonChooser.svelte";
    import { superForm } from "sveltekit-superforms/client";

    export let data;
    
    const { form, enhance, delayed, allErrors, message, tainted } = superForm(data.form, {
        clearOnSubmit: 'errors-and-message',
        delayMs: 500,
        timeoutMs: 8000,
    });
</script>

<div class="min-h-[calc(100dvh-4rem)] p-8 flex justify-around">
    <div class="w-[36rem]">
        <div class="w-full flex justify-between">
            <button on:click={() => { history.back() }} class="flex gap-1 p-1 mb-2 pr-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition">
                <Icon scale=1.25rem icon=arrow_back></Icon>
                <p>Back</p>
            </button>
            <button on:click={() => {
                $tainted = undefined;

                history.back();
            }} class="flex gap-1 p-1 mb-2 pr-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition">
                <Icon scale=1.25rem icon=cancel></Icon>
                <p>Cancel</p>
            </button>
        </div>
        <Line class="mb-4"></Line>
        <h1 class="text-2xl">Add Meeting:</h1>
        <form method="POST" use:enhance>
            <div class="flex gap-1 mt-4 items-center min-w-[275px] max-w-[75%]">
                <p class="text-lg">Name:</p>
                <input name=name bind:value={$form.name} class="w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"/>
            </div>
            <div class="flex gap-1 mt-4 items-center min-w-[275px] max-w-[75%]">
                <p class="text-lg">Location:</p>
                <input name=location bind:value={$form.location} class="w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"/>
            </div>
            <div class="flex gap-1 mt-4 items-center min-w-[275px] max-w-[75%]">
                <p class="text-lg">Starts:</p>
                <TimeInput name=starts bind:date={$form.starts} class="w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"/>
            </div>
            <div class="flex gap-1 mt-4 items-center min-w-[275px] max-w-[75%]">
                <p class="text-lg">Ends:</p>
                <TimeInput name=ends bind:date={$form.ends} class="w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"/>
            </div>
            <div class="flex gap-1 mt-4 items-center min-w-[275px] max-w-[75%]">
                <p class="text-lg">Thumbnail:</p>
                <IconChooser name=thumbnail bind:value={$form.thumbnail} class="w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700 text-left"></IconChooser>
            </div>
            <div class="flex gap-1 mt-4 items-center min-w-[275px] max-w-[75%]">
                <p class="text-lg">Lead:</p>
                <PersonChooser name=lead bind:value={$form.lead} class="w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700 text-left"></PersonChooser>
            </div>
            <div class="flex gap-1 mt-4 items-center min-w-[275px] max-w-[75%]">
                <p class="text-lg">Mentor:</p>
                <PersonChooser name=mentor bind:value={$form.mentor} class="w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700 text-left"></PersonChooser>
            </div>
            <div class="flex gap-1 mt-4 items-center min-w-[275px] max-w-[75%]">
                <p class="text-lg">Synopsis:</p>
                <PersonChooser name=synopsis bind:value={$form.synopsis} class="w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700 text-left"></PersonChooser>
            </div>
            {#if $allErrors.length || $message}
                <div class="w-full h-4"></div>
            {/if}
            {#if $allErrors.length}
                <ul>
                {#each $allErrors as error}
                    <li>
                        {#if Array.isArray(error.messages)}
                            {#each error.messages as code_error}
                                <p class="text-red-500 dark:text-red-500 font-bold">{code_error}</p>
                            {/each}
                        {:else}
                            <p class="text-red-500 dark:text-red-500 font-bold">{error.messages}</p>
                        {/if}
                    </li>
                {/each}
                </ul>
            {/if}
            {#if $message}
                <p class="text-red-500 dark:text-red-500 font-bold">{$message}</p>
            {/if}
            <div class="flex items-center mt-6 gap-4">
                <button class="b-blue flex items-center gap-1">
                    <Icon scale=1.25rem icon=save></Icon>
                    <p class="text-white">Create</p>
                </button>
                {#if $delayed}
                    <Loading></Loading>
                {/if}
            </div>
        </form>
    </div>
</div> 