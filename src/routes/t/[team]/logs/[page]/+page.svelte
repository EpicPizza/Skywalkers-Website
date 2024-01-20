<script lang=ts>
    import Ellipse from "$lib/Builders/Ellipse.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Member from "$lib/Components/Member.svelte";
    import type { createCurrentTeam } from "$lib/stores.js";
    import format from "date-and-time";
    import meridiem from 'date-and-time/plugin/meridiem';
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import { page } from '$app/stores';

    export let data;

    const team = getContext('team') as Writable<string>;
    let teamInfo = getContext('teamInfo') as Writable<Map<string, { name: string, website: string, icon: string }>>
    let currentTeam = getContext('currentTeam') as ReturnType<typeof createCurrentTeam>;

    $: info = $teamInfo.get($page.params.team == undefined ? ($currentTeam ? $currentTeam.team : "000000") : $page.params.team);

    format.plugin(meridiem);
</script>

<svelte:head>
    <title>{info?.name ?? "Skywalkers"} | Logs</title>
</svelte:head>

<div class="min-h-[calc(100dvh)] p-8 pt-[6.5rem] flex justify-around">
    <div class="w-[36rem] min-h-full relative">
        <div class="flex justify-between">
            <h1 class="text-3xl font-light">Logs</h1>
            <div class="flex gap-2 items-center">
                <svelte:element this={data.page.beginning ? "button" : "a"} disabled={data.page.beginning}  href="/t/{$team}/logs/1"  class="b-primary disabled:opacity-50 rotate-180"><Icon icon=double_arrow></Icon></svelte:element>
                <svelte:element this={data.page.beginning ? "button" : "a"} disabled={data.page.beginning}  href="/t/{$team}/logs/{data.page.on - 1}"  class="b-primary disabled:opacity-50"><Icon icon=arrow_back></Icon></svelte:element>
                <p class="mx-2">{data.page.showing} / {data.page.total.count}</p>
                <svelte:element this={data.page.end ? "button" : "a"} disabled={data.page.end} href="/t/{$team}/logs/{data.page.on + 1}" class="b-primary disabled:opacity-50"><Icon icon=arrow_forward></Icon></svelte:element>
                <svelte:element this={data.page.end ? "button" : "a"} disabled={data.page.end}  href="/t/{$team}/logs/{data.page.total.pages}"  class="b-primary disabled:opacity-50"><Icon icon=double_arrow></Icon></svelte:element>
            </div>
        </div>
        <Line class="my-4 mt-2"></Line>
        {#key data.logs}
            {#each data.logs as log}
                <div class="bg-accent-300 dark:bg-accent-700 w-full rounded-lg bg-opacity-25 dark:bg-opacity-25 mb-4 flex items-center px-6 gap-6">
                    <Icon scale=2rem class="opacity-90" icon={log.icon}></Icon>
                    <div class="h-full py-4 flex flex-col gap-1">
                        <Member id={log.id} silent let:member>
                            {#await member}
                                <h2 class="opacity-75">Loading<Ellipse/></h2>
                            {:then member} 
                                <div class="flex items-center gap-1.5">
                                    <img class="w-6 opacity-75 h-6 {member.photoURL == "/unknown.webp" ? "rounded-md" : "rounded-full"}" alt="Profile" src={member.photoURL}/>
                                    <h2 class="opacity-75">{member.displayName}{member.pronouns == "" ? "" : " (" + member.pronouns + ")" }</h2>
                                </div>
                            {/await}
                        </Member>
                        <p class="text-lg opacity-90">{log.content} <span class="text-sm opacity-75 ml-2">({format.format(log.timestamp, "M/DD/YY h:mm:ss a")})</span></p>
                    </div>
                </div>
            {:else}
                <p class="text-center text-red-500 font-bold text-lg mb-4">No Logs Found</p>
            {/each}
        {/key}
        <div class="flex gap-2 items-center">
            <svelte:element this={data.page.beginning ? "button" : "a"} disabled={data.page.beginning}  href="/t/{$team}/logs/1"  class="b-primary disabled:opacity-50 rotate-180"><Icon icon=double_arrow></Icon></svelte:element>
            <svelte:element this={data.page.beginning ? "button" : "a"} disabled={data.page.beginning}  href="/t/{$team}/logs/{data.page.on - 1}"  class="b-primary disabled:opacity-50"><Icon icon=arrow_back></Icon></svelte:element>
            <p class="mx-2 grow text-center">{data.page.showing} / {data.page.total.count}</p>
            <svelte:element this={data.page.end ? "button" : "a"} disabled={data.page.end} href="/t/{$team}/logs/{data.page.on + 1}" class="b-primary disabled:opacity-50"><Icon icon=arrow_forward></Icon></svelte:element>
            <svelte:element this={data.page.end ? "button" : "a"} disabled={data.page.end}  href="/t/{$team}/logs/{data.page.total.pages}"  class="b-primary disabled:opacity-50"><Icon icon=double_arrow></Icon></svelte:element>
        </div>
    </div>
</div>