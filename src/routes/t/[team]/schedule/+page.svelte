<script lang=ts>
    import Background from "$lib/Builders/Background.svelte";
    import DatePicker from "$lib/Builders/DatePicker.svelte";
    import Error from "$lib/Builders/Error.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    import Tooltip from "$lib/Builders/Tooltip.svelte";
    import RoleInput from "$lib/Components/RoleInput.svelte";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import { superForm } from "sveltekit-superforms/client";
    import dnt from 'date-and-time';
    import meridiem from "date-and-time/plugin/meridiem";
    import Page from "$lib/Builders/Page.svelte";
    import type { createCurrentTeam } from "$lib/stores.js";
    import { page } from '$app/stores';

    dnt.plugin(meridiem);

    export let data;

    const { form, delayed, enhance, message, allErrors } = superForm(data.form, { dataType: 'json' });

    let localLoading = getContext('localLoading') as Writable<boolean>;

    $: $localLoading = $delayed;

    let openStart = false;
    let openEnd = false;

    $: $form.timezone = $form.starting.getTimezoneOffset() ?? 0;

    let teamInfo = getContext('teamInfo') as Writable<Map<string, { name: string, website: string, icon: string }>>
    let currentTeam = getContext('currentTeam') as ReturnType<typeof createCurrentTeam>;

    $: info = $teamInfo.get($page.params.team == undefined ? ($currentTeam ? $currentTeam.team : "000000") : $page.params.team);
</script>

<svelte:head>
    <title>{info?.name ?? "Skywalkers"} | Scheduler</title>
</svelte:head>

<Background>
    <Page>
        <form use:enhance method=POST>
            <h1 class="text-2xl mb-8">Create Scheduler</h1>
            <div class="flex gap-1 items-center">
                <p class="text-lg">Title:</p>
                <input bind:value={$form.title} name=name class="w-full rounded-md p-1 px-1.5 bg-zinc-200 dark:bg-zinc-700"/>
            </div>
            <div class="flex gap-1 items-center mt-3">
                <p class="text-lg">Location:</p>
                <input bind:value={$form.location} name=location class="w-full rounded-md p-1 px-1.5 bg-zinc-200 dark:bg-zinc-700"/>
            </div>
            <div class="flex gap-1 mt-3">
                <p class="text-lg mt-1">Description:</p>
                <textarea bind:value={$form.description} name=description class="w-full rounded-md p-1 px-1.5 bg-zinc-200 dark:bg-zinc-700"/>
            </div>
            <div class="flex gap-1 mt-3 items-center">
                <DatePicker hideTimes bind:startTime={$form.starting} endTime={new Date()} bind:open={openStart}/>
                <p class="text-lg lg:text-xl whitespace-nowrap">Starting Date:</p>
                <p class="w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700">{dnt.format($form.starting, "ddd, MMM DD")}</p>
                <button class="-ml-[1.5rem] -translate-x-[0.3rem]" on:click={(e) => { e.preventDefault(); openStart = true; }}>
                    <Icon scale=1.25rem icon=schedule></Icon>
                </button>                
            </div>
            <div class="flex gap-1 mt-3 items-center">
                <DatePicker hideTimes bind:startTime={$form.ending} endTime={new Date()} bind:open={openEnd}/>
                <p class="text-lg lg:text-xl whitespace-nowrap">Ending Date:</p>
                <p class="w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700">{dnt.format($form.ending, "ddd, MMM DD")}</p>
                <button class="-ml-[1.5rem] -translate-x-[0.3rem]" on:click={(e) => { e.preventDefault(); openEnd = true; }}>
                    <Icon scale=1.25rem icon=schedule></Icon>
                </button>                
            </div>
            <div class="flex gap-1 mt-3 items-center">
                <Tooltip text="Length of each meeting.">
                    <p class="text-lg whitespace-nowrap">Meeting Length:</p>
                </Tooltip>
                <div class="flex items-center w-full gap-1">
                    <button on:click|preventDefault={() => { if($form.length > 0) $form.length--; }} class="h-[32px] w-[32px] b-primary flex items-center justify-around">
                        <Icon scale=1.3rem icon=remove></Icon>
                    </button>
                    <input bind:value={$form.length} name=name type="number" class="w-full rounded-md p-1 px-1.5 bg-zinc-200 dark:bg-zinc-700 appearance-none"/>
                    <button on:click|preventDefault={() => { $form.length++; }} class="h-[32px] w-[32px] b-primary flex items-center justify-around">
                        <Icon scale=1.3rem icon=add></Icon>
                    </button>
                </div>
            </div>
            <div class="flex gap-1 mt-3 items-center">
                <Tooltip text="Members in each meeting.">
                    <p class="text-lg whitespace-nowrap">Member Count:</p>
                </Tooltip>
                <div class="flex items-center w-full gap-1">
                    <button on:click|preventDefault={() => { if($form.member > 0) $form.member--; }} class="h-[32px] w-[32px] b-primary flex items-center justify-around">
                        <Icon scale=1.3rem icon=remove></Icon>
                    </button>
                    <input bind:value={$form.member} name=name type="number" class="w-full rounded-md p-1 px-1.5 bg-zinc-200 dark:bg-zinc-700 appearance-none"/>
                    <button on:click|preventDefault={() => { $form.member++; }} class="h-[32px] w-[32px] b-primary flex items-center justify-around">
                        <Icon scale=1.3rem icon=add></Icon>
                    </button>
                </div>
            </div>
            <div class="flex gap-1 mt-3 items-center">
                <Tooltip text="Require one in each meeting.">
                    <p class="text-lg">Group:</p>
                </Tooltip>
                <RoleInput bind:value={$form.group} optional roles={data.roles} name=role class="w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"/>
            </div>
            <div class="flex gap-1 mt-3 items-center">
                <Tooltip text="Require one in each meeting.">
                    <p class="text-lg">Require:</p>
                </Tooltip>
                <RoleInput bind:value={$form.require} optional roles={data.roles} name=role class="w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"/>
            </div>
            <Error {allErrors} {message}></Error>
            <div class="h-6 w-full"></div>
            <button class="b-primary float-right">Create</button>
        </form>
    </Page>
</Background>

<style lang=postcss>
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
</style>