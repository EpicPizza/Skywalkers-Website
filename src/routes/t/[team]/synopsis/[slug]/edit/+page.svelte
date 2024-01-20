<script lang=ts>
    import Ellipse from "$lib/Builders/Ellipse.svelte";
    import Error from "$lib/Builders/Error.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Loading from "$lib/Builders/Loading.svelte";
    import FileChooser from "$lib/Components/FileChooser.svelte";
    import Member from "$lib/Components/Member.svelte";
    import MiniProfile from "$lib/Components/MiniProfile.svelte";
    import PersonDialog from "$lib/Components/PersonDialog.svelte";
    import type { FirestoreUser } from "$lib/Firebase/firebase.js";
    import type { createCurrentTeam } from "$lib/stores.js";
    import format from "date-and-time";
    import meridiem from "date-and-time/plugin/meridiem";
    import { getContext } from "svelte";
    import { flip } from "svelte/animate";
    import type { Writable } from "svelte/store";
    import { superForm } from "sveltekit-superforms/client";
    import { page } from '$app/stores';

    export let data;

    const team = getContext('team') as Writable<string>;

    format.plugin(meridiem);

    let { tainted, form, enhance, allErrors, message, delayed, reset } = superForm(data.form, { dataType: 'json' });

    let willReset = false;

    let open = false;

    let idList: string[] = [];

    $: idList = listIds($form.hours);
    
    function listIds(hours: typeof $form.hours) {
        let list = new Array<string>();

        for(let i = 0; i < hours.length; i++) {
            list.push(hours[i].id);
        }

        return list;
    }

    $: {
        if($message == 'Success') {
            history.back();
        }
    }

    function getRole(user: FirestoreUser) {
        for(let i = 0; i < user.teams.length; i++) {
            if(user.teams[i].team == $team) {
                return user.teams[i].role;
            }
        }

        return "Unknown";
    }

    let teamInfo = getContext('teamInfo') as Writable<Map<string, { name: string, website: string, icon: string }>>
    let currentTeam = getContext('currentTeam') as ReturnType<typeof createCurrentTeam>;

    $: info = $teamInfo.get($page.params.team == undefined ? ($currentTeam ? $currentTeam.team : "000000") : $page.params.team);
</script>

<svelte:head>
    <title>{info?.name ?? "Skywalkers"} | Edit Synopsis</title>
</svelte:head>

<div class="min-h-[calc(100dvh)] p-4 sm:p-8 pt-[88px] sm:pt-[88px] flex justify-around">
    <div class="w-[35rem] lg:w-[44rem] overflow-hidden px-2">
        <div class="w-full flex justify-between">
            <button on:click={() => { willReset = true; history.back(); }} class="flex gap-1 p-1 mb-2 pr-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition lg:text-lg">
                <Icon scale={0} class="text-[1.25rem] w-[1.25rem] h-[1.25rem] lg:text-[1.5rem] lg:w-[1.5rem] lg:h-[1.5rem]" icon=arrow_back></Icon>
                <p>Back</p>
            </button>
            <button on:click={() => {
                $tainted = undefined;

                willReset = true;

                history.back();
            }} class="flex gap-1 p-1 mb-2 pr-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition lg:text-lg">
                <Icon scale={0} class="text-[1.25rem] w-[1.25rem] h-[1.25rem] lg:text-[1.5rem] lg:w-[1.5rem] lg:h-[1.5rem]" icon=cancel></Icon>
                <p>Cancel</p>
            </button>
        </div>
        <Line class="mb-4"></Line>
        <h1 class="text-2xl lg:text-3xl pb-4">Edit Synopsis:</h1>
        <div class="opacity-75 flex items-center mb-4 lg:mb-6">
            <Icon scale={0}  class="text-[1.5rem] w-[1.5rem] h-[1.5rem] lg:text-[1.75rem] lg:w-[1.75rem] lg:h-[1.75rem] mb-auto" icon=info></Icon>
            <p class="ml-2 lg:text-lg">Editing the synopsis will not update the synopsis message sent to the discord server. Deleting attachments will prevent the image urls sent to discord from working, but images may be cached by discord for some time.</p>
        </div>
        <form method=POST use:enhance>
            <div class="mt-8 items-center w-full">
                <div class="flex justify-between">
                    <p class="text-lg lg:text-xl mb-3">Synopsis:</p>
                    <p class="lg:text-lg mt-auto mb-3 {$form.synopsis.length > 10000 ? "text-red-500 dark:text-red-500 font-bold" : "opacity-50"}">{$form.synopsis.length}/10000</p>
                </div>
                <textarea placeholder="Write Synopsis Here" name=synopsis bind:value={$form.synopsis} class="p-5 lg:text-lg w-full rounded-xl bg-zinc-200 dark:bg-zinc-700 h-52"/>
            </div>
            <p class="text-lg lg:text-xl mb-3 mt-4">Attachments:</p>
            <FileChooser bind:files={$form.new} bind:old={$form.old}/>
            <p class="text-lg lg:text-xl mb-3 mt-4">Hours:</p>
            <div class="border-border-light dark:border-border-dark border-[1px] rounded-xl p-4 flex flex-col gap-4">
                {#each $form.hours as member, i (member.id)}
                    <Member id={member.id} let:member={user}>
                        {#await user}
                            <p class="h-9 flex items-center">Loading<Ellipse/></p>
                        {:then user}
                            {@const role = getRole(user)}
                            <div class="flex items-center gap-2.5">
                                <img class="h-8 w-8 lg:h-9 lg:w-9 rounded-full" alt="{user.displayName}{user.pronouns == "" ? "" : " (" + user.pronouns + ")"}'s Profile" src={user.photoURL}/>
                                <p class="text-lg lg:text-xl grow overflow-hidden whitespace-nowrap overflow-ellipsis">{user.displayName}{user.pronouns == "" ? "" : " (" + user.pronouns + ")"}</p>
                                <div class="flex gap-1.5">
                                    {#if role == 'student'}
                                        <button disabled={member.time <= 0} class="b-primary disabled:cursor-not-allowed w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-around" on:click|preventDefault={() => { if(member.time < 0.25) { member.time = 0; } else if(member.time > 12) { member.time = 12; } else {  member.time -= 0.25; } }}><Icon scale=1.25rem icon=remove></Icon></button>
                                        <input step="0.25" class="w-16 p-2 py-0.5 text-lg lg:text-xl text-center rounded-md" type=number bind:value={member.time}/>
                                        <button disabled={member.time >= 12} class="b-primary disabled:cursor-not-allowed w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-around" on:click|preventDefault={() => { if(member.time > 11.75) { member.time = 12; } else if(member.time < 0) { member.time = 0; } else {  member.time += 0.25; } }}><Icon scale=1.25rem icon=add></Icon></button>
                                    {/if}
                                    <button class="b-accent w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-around" on:click|preventDefault={() => { $form.hours.splice(i, 1); $form.hours = $form.hours; }}><Icon scale=1.25rem icon=delete></Icon></button>
                                </div>
                            </div>
                        {/await}
                    </Member> 
                {:else}
                    <p>No Members</p>
                {/each}
                <div class="flex items-center">
                    <Line class="mr-2"></Line>
                    <button class="b-primary whitespace-nowrap lg:p-1 lg:px-2 lg:text-lg" on:click|preventDefault={() => { open = !open; }}>Add Member</button>
                    <Line class="ml-2"></Line>
                </div>
            </div>
            <PersonDialog bind:open ignore={idList} on:choosen={(event) => { $form.hours.push({ id: event.detail.id, time: 3 }); $form.hours = $form.hours; }}></PersonDialog>
            <Error disallowMessage=Success {allErrors} {message}></Error>
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

<style lang=postcss>
    input[type='number']::-webkit-outer-spin-button,
    input[type='number']::-webkit-inner-spin-button,
    input[type='number'] {
        -webkit-appearance: none;
        margin: 0;
        -moz-appearance: textfield !important;
    }
</style>