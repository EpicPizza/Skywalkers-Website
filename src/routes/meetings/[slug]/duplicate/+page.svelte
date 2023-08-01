<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Loading from "$lib/Builders/Loading.svelte";
    import TimeInput from "$lib/Components/DateTimeInput.svelte";
    import IconChooser from "$lib/Components/IconChooser.svelte";
    import PersonChooser from "$lib/Components/PersonChooser.svelte";
    import { superForm } from "sveltekit-superforms/client";
    import Error from "$lib/Builders/Error.svelte";

    export let data;
    
    const { form, enhance, delayed, allErrors, message, tainted } = superForm(data.form, {
        clearOnSubmit: 'errors-and-message',
        delayMs: 500,
        timeoutMs: 8000,
    });
</script>

<svelte:head>
    <title>Skywalkers | Add Meeting</title>
</svelte:head>

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
        <h1 class="text-2xl lg:text-3xl pb-4">Add Meeting:</h1>
        <form method="POST" use:enhance>
            <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
                <p class="text-lg lg:text-xl">Name:</p>
                <input name=name bind:value={$form.name} class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"/>
            </div>
            <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
                <p class="text-lg lg:text-xl">Location:</p>
                <input name=location bind:value={$form.location} class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"/>
            </div>
            <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
                <p class="text-lg lg:text-xl">Starts:</p>
                <TimeInput name=starts bind:date={$form.starts} class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"/>
            </div>
            <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
                <p class="text-lg lg:text-xl">Ends:</p>
                <TimeInput name=ends bind:date={$form.ends} class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"/>
            </div>
            <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
                <p class="text-lg lg:text-xl">Thumbnail:</p>
                <IconChooser name=thumbnail bind:value={$form.thumbnail} class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700 text-left"></IconChooser>
            </div>
            <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
                <p class="text-lg lg:text-xl">Lead:</p>
                <PersonChooser name=lead bind:value={$form.lead} class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700 text-left"></PersonChooser>
            </div>
            <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
                <p class="text-lg lg:text-xl">Mentor:</p>
                <PersonChooser optional name=mentor bind:value={$form.mentor} class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700 text-left"></PersonChooser>
            </div>
            <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
                <p class="text-lg lg:text-xl">Synopsis:</p>
                <PersonChooser optional name=synopsis bind:value={$form.synopsis} class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700 text-left"></PersonChooser>
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