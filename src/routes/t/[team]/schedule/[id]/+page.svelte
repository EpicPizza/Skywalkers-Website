<script lang=ts>
    import Icon from '$lib/Builders/Icon.svelte';
    import dnt from 'date-and-time';
    import meridiem from 'date-and-time/plugin/meridiem';
    import Markdown from '$lib/Markdown/Markdown.svelte';
    import { getContext, onMount } from 'svelte';
    import type { firebaseClient } from '$lib/Firebase/firebase.js';
    import { doc, onSnapshot, setDoc, updateDoc, type Unsubscribe } from 'firebase/firestore';
    import { page, updated } from '$app/stores';
    import type { Unsubscriber, Writable } from 'svelte/store';
    import Member from '$lib/Components/Member.svelte';
    import Ellipse from '$lib/Builders/Ellipse.svelte';
    import Use from '$lib/Batteries/Use.svelte';
    import Tooltip from '$lib/Builders/Tooltip.svelte';
    import Dialog from '$lib/Builders/Dialog.svelte';
    import { superForm } from 'sveltekit-superforms/client';
    import Error from '$lib/Builders/Error.svelte';
    import Role from '$lib/Components/Role.svelte';
    import { browser } from '$app/environment';
    import type { Warning, createCurrentTeam } from '$lib/stores.js';
    import { goto } from '$app/navigation';

    export let data;

    dnt.plugin(meridiem);

    let client = getContext('client') as ReturnType<typeof firebaseClient>;
    let warning = getContext('warning') as Writable<Warning | undefined>;
    let localLoading = getContext('localLoading') as Writable<boolean>;
    let team = getContext('team') as Writable<string>;
    let teamInfo = getContext('teamInfo') as Writable<Map<string, { name: string, website: string, icon: string }>>
    let currentTeam = getContext('currentTeam') as ReturnType<typeof createCurrentTeam>;

    $: info = $teamInfo.get($page.params.team == undefined ? ($currentTeam ? $currentTeam.team : "000000") : $page.params.team);

    onMount(() => {
        localLoading.set(false);

        let unsubscribeClient: Unsubscriber;
        let unsubscribeFirestore: Unsubscribe;

        unsubscribeClient = client.subscribe((current) => {
            if(current == undefined || current.teams == undefined || 'preload' in current) return;

            let database = client.getFirestore();

            let ref = doc(database, "teams", $team, "schedule", $page.params.id);

            unsubscribeFirestore = onSnapshot(ref, (snapshot) => {
                if(!snapshot.data()) return;

                data.schedule = {
                    title: snapshot.data()?.title as string,
                    description: snapshot.data()?.description as string,
                    first: snapshot.data()?.first.toDate() as Date,
                    days: snapshot.data()?.days as number,
                    times: snapshot.data()?.times as number,
                    length: snapshot.data()?.length as number,
                    count: snapshot.data()?.count as number,
                    member: snapshot.data()?.member as number,
                    require: snapshot.data()?.require as string | null,
                    location: snapshot.data()?.location as string | null,
                    group: snapshot.data()?.group as string | null,
                    signups: snapshot.data()?.signups as { [key: string]: { availability: { day: number, time: number }[] }},
                    confirm: (snapshot.data()?.confirm ?? []) as null | { members: string[], slots: { day: number, time: number}[] }[],
                }
            })
        })

        return () => {
            unsubscribeClient();
            unsubscribeFirestore();
        }
    })

    //@ts-ignore
    let days = Array.apply(null, {length: data.schedule.days}).map(Number.call, Number) as number[];
    //@ts-ignore
    let times = Array.apply(null, {length: data.schedule.times}).map(Number.call, Number) as number[];

    let first = data.schedule.first;

    let selected: { day: number, time: number }[] = data.schedule.signups[$client?.uid ?? "00000"] ? data.schedule.signups[$client?.uid ?? "00000"].availability ?? [] : [];
    let hovering: { day: number, time: number }[] = []; 


    function isSelected(day: number, time: number) {
        for(let i = 0; i < selected.length; i++) {
            if(selected[i].day == day && selected[i].time == time) {
                return true;
            }
        }

        return false;
    }

    function isHovering(day: number, time: number) {
        for(let i = 0; i < hovering.length; i++) {
            if(hovering[i].day == day && hovering[i].time == time) {
                return true;
            }
        }

        return false;
    }

    let transfer: {day: number, time: number, mode: boolean} | undefined = undefined;

    function dragStart(day: number, time: number) {
        let found: boolean | number = false;

        for(let i = 0; i < selected.length; i++) {
            if(selected[i].day == day && selected[i].time == time) {
                found = true;
            }
        }

        transfer = { day: day, time: time, mode: found };
        hovering = [{ day: day, time: time }];
    }

    function dragEnd(day: number, time: number) {
        if(!transfer) return;

        for(let i = 0; i < days.length; i++) {
            for(let j = 0; j < times.length; j++) {
                if(((days[i] >= transfer.day && days[i] <= day) || (days[i] <= transfer.day && days[i] >= day)) && ((times[j] >= transfer.time && times[j] <= time) || (times[j] <= transfer.time && times[j] >= time))) {
                    let found: boolean | number = false;

                    for(let x = 0; x < selected.length; x++) {
                        if(selected[x].day == days[i] && selected[x].time == times[j]) {
                            found = x;
                        }
                    }

                    if(found === false) {
                        if(!transfer.mode) {
                            selected.push({ day: days[i], time: times[j] });
                        }
                    } else {
                        if(transfer.mode) {
                            selected.splice(found, 1);
                        }
                    }
                }
            }
        }

        selected = selected;
        hovering = [];
        times = times;
        days = days;
        transfer = undefined;
    } 

    function dragOver(day: number, time: number) {
        if(!transfer) return;

        hovering = [];

        for(let i = 0; i < days.length; i++) {
            for(let j = 0; j < times.length; j++) {
                if(((days[i] >= transfer.day && days[i] <= day) || (days[i] <= transfer.day && days[i] >= day)) && ((times[j] >= transfer.time && times[j] <= time) || (times[j] <= transfer.time && times[j] >= time))) {
                    let found: boolean | number = false;

                    for(let x = 0; x < hovering.length; x++) {
                        if(hovering[x].day ==  days[i] && hovering[x].time == times[j]) {
                            found = x;
                        }
                    }

                    if(found === false) {
                        hovering.push({ day: days[i], time: times[j] });
                    } else {
                        hovering.splice(found, 1);
                    }
                }
            }
        }

        hovering = hovering;
        times = times;
        days = days;
    } 

    function getPercent(day: number, time: number) {
        let count = 0; 

        let keys = Object.keys(data.schedule.signups);

        for(let i = 0; i < keys.length; i++) {
            let availability = data.schedule.signups[keys[i]].availability;

            for(let x = 0; x < availability.length; x++) {
                if(availability[x].day == day && availability[x].time == time) {
                    count++;
                }
            }
        }

        return count / keys.length;
    }

    function isConfirmed(day: number, time: number) {
        if(data.schedule.confirm == null) return 0;

        for(let i = 0; i < data.schedule.confirm.length; i++) {
            for(let j = 0; j < data.schedule.confirm[i].slots.length; j++) {
                if(data.schedule.confirm[i].slots[j].day == day && data.schedule.confirm[i].slots[j].time == time) {
                    return 2;
                }
            }
        }

        return 1;
    }

    function getIndex(day: number, time: number) {
        if(data.schedule.confirm == null) return -1;

        for(let i = 0; i < data.schedule.confirm.length; i++) {
            for(let j = 0; j < data.schedule.confirm[i].slots.length; j++) {
                if(data.schedule.confirm[i].slots[j].day == day && data.schedule.confirm[i].slots[j].time == time) {
                    return i;
                }
            }
        }

        return -1;
    }


    async function getPeople(day: number, time: number) {
        let people = ""; 

        let keys = Object.keys(data.schedule.signups);

        for(let i = 0; i < keys.length; i++) {
            let availability = data.schedule.signups[keys[i]].availability;

            for(let x = 0; x < availability.length; x++) {
                if(availability[x].day == day && availability[x].time == time) {
                    let user = await client.getUser(keys[i]);

                    if(user) {
                        people += user.displayName + ", ";
                    }
                }
            }
        }

        return people.substring(0, people.length - 2);
    }

    let pressed = false;

    async function finish() {
        if(pressed) return;

        pressed = true;

        const res = await fetch("/t/" + $team + "/schedule/" + $page.params.id, { method: "POST" });

        if(res.status == 406) {
            warning.set({
                color: 'red',
                message: JSON.parse(await res.text()).message,
            })
        } else {
            await goto("/t/" + $team + "/meetings?schedule=" + $page.params.id);
        }
    }

    $: {
        if(!($client == undefined || $client.teams == undefined || 'preload' in $client)) {
            let database = client.getFirestore();

            let ref = doc(database, "teams", $team, "schedule", $page.params.id);

            let loc = ("signups." + $client?.uid ?? "000000");

            updateDoc(ref, {
                [loc]: { availability: selected },
            })
        }
    }

    $: {
        if($page.url.searchParams.get("confirm") == 'true') {
            open = false;
            confirming = true;
            selecting = true;
            reject = [];
            if(browser && side) side.scrollTo({ top: 0 });
        } else {
            confirming = false;
        }
    }

    let selecting = true;
    let confirming = false;

    let reject: number[] = [];

    let initialFocus: HTMLElement;

    let open = false;

    let side: HTMLElement;

    const { allErrors, message, delayed, enhance } = superForm(data.form)
</script>

<svelte:head>
    <title>{info?.name ?? "Skywalkers"} | Scheduler</title>
</svelte:head>

<div class="border border-border-light dark:border-border-dark rounded-lg shadow-lg p-4 mb-4 bg-backgroud-light dark:bg-backgroud-dark flex items-center justify-between w-full overflow-hidden">
    <h1 class="text-xl overflow-hidden whitespace-nowrap overflow-ellipsis">{data.schedule.title}</h1>
    <div class="flex items-center gap-1.5">
        <button disabled={pressed} on:click={async () => { 
            if(confirming) {
                finish();
            } else {
                open = !open;
            }
        }} class="h-9 rounded-full {confirming ? "b-green" : "b-accent"} flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed">
            {#if confirming}
                Confirm
            {:else}
                Finish
            {/if}
            <Icon scale={confirming ? "1.5rem" : "1.2rem"} icon={confirming ? "check" : "send"}></Icon>
        </button>
    </div>
</div>

<div class="flex flex-col-reverse sm:flex-row gap-4 h-fit sm:h-[calc(100dvh-12rem)] pb-4 sm:pb-0">
    <div class="w-full overflow-x-auto border relative border-border-light dark:border-border-dark rounded-lg shadow-lg bg-backgroud-light dark:bg-backgroud-dark">
        <table class="my-6 mb-8 ml-2 mr-20">
            <tr>
                <th></th>
                {#each days as day}
                    <th class="select-none pb-1">
                        <p>{dnt.format(new Date(first.valueOf() + (day * 1000 * 60 * 60 * 24)), "dddd")}</p>
                        <p>{dnt.format(new Date(first.valueOf() + (day * 1000 * 60 * 60 * 24)), "MM/DD")}</p>
                    </th>
                {/each}
            </tr>
            {#each times as time}
                <tr>
                    <td class="border-none text-right pr-2 flex flex-row-reverse min-w-[5rem]"><span class="block -translate-y-3 select-none">{dnt.format(new Date(first.valueOf() + (1000 * 60 * 60) * time), "h a")}</span></td>
                    {#each days as day}
                        {#if selecting}
                            {#if confirming}
                                {#key reject}
                                    <td class="p-0">
                                        <button on:click={() => { 
                                            if(reject.includes(getIndex(day, time))) { 
                                                reject.splice(reject.indexOf(getIndex(day, time)), 1); 
                                            } else { 
                                                reject.push(getIndex(day, time)); 
                                            } 

                                            reject = reject; 
                                        }} class="min-w-[6.5rem] h-full {isConfirmed(day, time) == 0 ? "bg-red-500" : (isConfirmed(day, time) == 1 ? "bg-none" : (reject.includes(getIndex(day, time)) ? "bg-blue-500 bg-opacity-50" : "bg-green-500"))} translate-y-1 transition"></button>
                                    </td>
                                {/key}
                            {:else}
                                <td class="p-0">
                                    <button tabindex="0" on:keypress={() => { if(transfer == undefined) { dragStart(day, time) } else { dragEnd(day, time); } }} on:focus={() => { dragOver(day, time); }} on:mouseover={() => { dragOver(day, time); }} on:mousedown={() => { dragStart(day, time); }} on:mouseup={() => { dragEnd(day, time); }} class="min-w-[6.5rem] h-full bg-primary-500 {isSelected(day, time) ? (isHovering(day, time) ? "bg-opacity-30" : "bg-opacity-60 hover:bg-opacity-50") : (isHovering(day, time) ? "bg-opacity-30" : "bg-opacity-0 hover:bg-opacity-10")} translate-y-1 transition"></button>
                                </td>
                            {/if}
                        {:else}
                            <td style="opacity: {getPercent(day, time)};" class="min-w-[calc(6.5rem+1px)] bg-accent-500">
                                {#await getPeople(day, time) then text}
                                    {#if text != ""}
                                        <Tooltip {text} class="w-full h-full">
                                            
                                        </Tooltip>
                                    {/if}
                                {/await}
                            </td>
                        {/if}
                    {/each}
                </tr>
            {/each}
        </table>
    </div>
    <div bind:this={side} class="w-full sm:w-[50%] sm:max-w-[25rem] sm:min-w-[15rem] border border-border-light dark:border-border-dark rounded-lg shadow-lg bg-backgroud-light dark:bg-backgroud-dark p-4 overflow-auto">
        {#if data.schedule.confirm != null && confirming}
            <h2 class="text-base opacity-50 uppercase font-bold">Optimal Meetings</h2>
            {#each data.schedule.confirm as meeting}
                <div class="flex items-center">
                    <p class="mt-1 mr-3">{dnt.format(new Date(first.valueOf() + (meeting.slots[0].day * 1000 * 60 * 60 * 24)), "MM/DD")}: {dnt.format(new Date(first.valueOf() + (1000 * 60 * 60) * meeting.slots[0].time), "h a")} - {dnt.format(new Date(first.valueOf() + (1000 * 60 * 60) * (meeting.slots[meeting.slots.length - 1].time + 1)), "h a")}</p>
                    {#each meeting.members as member}
                        <Member id={member} let:member>
                            {#await member then member}
                                <Tooltip class="rounded-full translate-y-0.5 w-7 h-7 border-[3px] border-backgroud-light dark:border-backgroud-dark -ml-2.5" text={member.displayName}>
                                    <img class="rounded-full" src={member.photoURL}>
                                </Tooltip>
                            {/await}
                        </Member>
                    {/each}
                </div>
            {/each}
        {/if}
        <h2 class="text-base opacity-50 uppercase font-bold -mb-3 {data.schedule.confirm != null && confirming ? "mt-5" : ""}">Description</h2>
        <Markdown content={data.schedule.description}/>
        <h2 class="text-base opacity-50 uppercase font-bold mt-5">Meeting Info</h2>
        <p class="mt-1">{data.schedule.length} hour{data.schedule.length != 1 ? "s" : ""} each</p>
        <p class="mt-1">Min {data.schedule.member} member{data.schedule.member != 1 ? "s" : ""} per meeting</p>
        {#if data.schedule.location != null}
            <p class="mt-1">At {data.schedule.location}</p>
        {/if}
        {#if data.schedule.group != null}
            <p class="mt-1 flex items-center gap-2">
                <Role id={data.schedule.group} let:role>
                    {#await role}
                        Loading<Ellipse></Ellipse>
                    {:then role} 
                        Group: <span style="background-color: {role.color};" class="w-4 h-4 -mr-0.5 block rounded-full"></span> {role.name}   
                    {/await}
                </Role>
            </p>
        {/if}
        <h2 class="text-base opacity-50 uppercase font-bold mt-5 mb-2">Signed Up</h2>
        <div class="flex flex-col gap-2">
            {#each Object.keys(data.schedule.signups) as key}
                {@const signup = data.schedule.signups[key]}
                <Member id={key} let:member>
                    {#await member}
                        <p>Loading<Ellipse></Ellipse></p>
                    {:then member} 
                        <div class="flex items-center gap-1.5 {signup.availability.length == 0 ? "opacity-25" : "opacity-100"}">
                            <img class="w-6 h-6 rounded-full" src={member.photoURL}>
                            <span>{member.displayName}{member.pronouns == "" ? "" : " (" + member.pronouns + ")" }</span>
                        </div>
                    {/await}
                </Member>
            {:else}
                <p class="mt-1">No Members Have Signed Up</p>
            {/each}
        </div>

        <button on:click={() => { selecting = !selecting; }} class="w-full b-accent mt-6">
            {selecting ? "See" : "Hide"} availabilities
        </button>
    </div>
</div>

<Dialog bind:isOpen={open} width="24rem" {initialFocus}>
    <h1 class="text-2xl" slot=title>Finish</h1>
    <form slot=content method=POST use:enhance>
        <div class="mt-6">
            <p>Schedule meetings for <span class="font-extrabold">{data.schedule.title}</span>?</p>
            <Error {message} {allErrors}></Error>
            <div class="flex flex-row-reverse mt-6">
                <button class="b-green w-16">Yes</button>
                <button bind:this={initialFocus} on:click|preventDefault={() => open = !open} class="b-red mr-2 w-16">No</button>
            </div>
        </div>
    </form>
</Dialog>

<style lang=postcss>
    td {
        @apply h-12 border border-border-light dark:border-border-dark
    }
</style>