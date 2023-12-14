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
    import type { Warning } from "$lib/stores.js";
    import format from "date-and-time";
    import meridiem from "date-and-time/plugin/meridiem";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import { superForm } from "sveltekit-superforms/client";

    export let data;

    format.plugin(meridiem);

    let { tainted, capture, restore, form, enhance, allErrors, message, delayed, reset } = superForm(data.form, { dataType: 'json' });

    let willReset = false;

    function middleManRestore(arg: any) {
        restore(arg as any);

        $tainted = { synopsis: $form.synopsis.length > 0 };
    }

    function middleManCapture() {
        if(!willReset) {
            return capture();   
        }
    }

    export const snapshot = { capture: middleManCapture, restore: middleManRestore };

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
</script>

<svelte:head>
    <title>Skywalkers | Complete Meeting</title>
</svelte:head>

<div class="min-h-[calc(100dvh)] p-4 sm:p-8 pt-[88px] sm:pt-[88px] flex justify-around">
    <div class="w-[36rem] lg:w-[44rem] overflow-hidden">
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
        <h1 class="text-2xl lg:text-3xl pb-4">Complete Meeting:</h1>
        <div class="p-4 border-border-light dark:border-border-dark border-[1px] rounded-3xl">
            <div class="p-4 lg:p-6 bg-accent-500 text-black rounded-2xl flex items-center">
                {#if data.meeting.thumbnail.startsWith("icon:")}
                    <Icon scale={0} class="text-[4rem] w-[4rem] h-[4rem] lg:text-[5rem] lg:w-[5rem] lg:h-[5rem]" icon={data.meeting.thumbnail.substring(5, data.meeting.thumbnail.length)}/>
                {/if}
                <div class="ml-4 lg:ml-5 grow">
                    <div class="text-2xl lg:text-3xl lg:mb-1">{data.meeting.name}</div>
                    <div class="text-lg lg:text-xl opacity-80 whitespace-nowrap">At {data.meeting.location}</div>
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
            {#if data.meeting.role != undefined}
                <div class="mt-4 flex gap-2 items-center">
                    <Icon class="text-[1.75rem] w-[1.75rem] h-[1.75rem] lg:text-[2.25rem] lg:w-[2.25rem] lg:h-[2.25rem]" scale={0} icon=group></Icon>
                    <span class="text-lg lg:text-xl">Group:</span>
                    <a href="/settings/roles/{data.meeting.role.id}" class="flex items-center w-fit bg-zinc-200 dark:bg-zinc-600 rounded-full p-1 pr-4">
                        <div style="background-color: {data.meeting.role.color};" class="w-4 h-4 m-0.5 mx-2 lg:w-5 lg:h-5 lg:m-2 rounded-full"></div>
                        <p class="text-lg lg:text-xl">{data.meeting.role.name}</p>
                    </a>
                </div>
            {/if}
        </div>  
        <form enctype=multipart/form-data method=POST use:enhance>
            <div class="mt-8 items-center w-full">
                <div class="flex justify-between">
                    <p class="text-lg lg:text-xl mb-3">Synopsis:</p>
                    <p class="lg:text-lg mt-auto mb-3 {$form.synopsis.length > 10000 ? "text-red-500 dark:text-red-500 font-bold" : "opacity-50"}">{$form.synopsis.length}/10000</p>
                </div>
                <textarea placeholder="Write Synopsis Here" name=synopsis bind:value={$form.synopsis} class="p-5 lg:text-lg w-full rounded-3xl bg-zinc-200 dark:bg-zinc-700 h-52"/>
            </div>
            <p class="text-lg lg:text-xl mb-3 mt-4">Attachments:</p>
            <FileChooser name=attachments/>
            <p class="text-lg lg:text-xl mb-3 mt-4">Hours:</p>
            <div class="border-border-light dark:border-border-dark border-[1px] rounded-3xl p-4 flex flex-col gap-4">
                {#each $form.hours as member, i (member.id)}
                    <Member id={member.id} let:member={user}>
                        {#await user}
                            <p class="h-9 flex items-center">Loading<Ellipse/></p>
                        {:then user}
                            <div class="flex items-center gap-2.5">
                                <img class="h-8 w-8 lg:h-9 lg:w-9 rounded-full" alt="{user.displayName}{user.pronouns == "" ? "" : " (" + user.pronouns + ")"}'s Profile" src={user.photoURL}/>
                                <p class="text-lg lg:text-xl grow overflow-hidden whitespace-nowrap overflow-ellipsis">{user.displayName}{user.pronouns == "" ? "" : " (" + user.pronouns + ")"}</p>
                                <div class="flex gap-1.5">
                                    <button disabled={member.time <= 0} class="b-primary disabled:cursor-not-allowed w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-around" on:click|preventDefault={() => { if(member.time < 0.25) { member.time = 0; } else if(member.time > 12) { member.time = 12; } else {  member.time -= 0.25; } }}><Icon scale=1.25rem icon=remove></Icon></button>
                                    <input step="0.25" class="w-16 p-2 py-0.5 text-lg lg:text-xl text-center rounded-md" type=number bind:value={member.time}/>
                                    <button disabled={member.time >= 12} class="b-primary disabled:cursor-not-allowed w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-around" on:click|preventDefault={() => { if(member.time > 11.75) { member.time = 12; } else if(member.time < 0) { member.time = 0; } else {  member.time += 0.25; } }}><Icon scale=1.25rem icon=add></Icon></button>
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
            <div class="flex gap-2 mt-6 items-center lg:gap-3">
                <button on:click|preventDefault={() => { $form.discord = !$form.discord }} class="p-1 {$form.discord ? "border-blue-700 dark:border-blue-500 bg-blue-200 dark:bg-blue-900 text-blue-700 dark:text-blue-500" : "border-border-light dark:border-border-dark text-border-light dark:text-border-dark"} border-[1px] rounded-md m-0.5 transition disabled:cursor-not-allowed disabled:opacity-40">
                    <Icon icon=check></Icon>
                </button>
                <p class="text-lg">Send synopsis message to discord.</p>
            </div>
            <PersonDialog multiple bind:open ignore={idList} on:choosen={(event) => { console.log(event.detail.id); for(let i = 0; i < event.detail.id.length; i++) { $form.hours.push({ id: event.detail.id[i], time: data.meeting.length }); } $form.hours = $form.hours; }}></PersonDialog>
            <Error {allErrors} {message}></Error>
            <div class="flex items-center mt-7 gap-4">
                <button class="b-primary lg:p-1 lg:px-2 lg:text-lg flex items-center gap-1">
                    <p class="text-inherit">Complete</p>
                    <Icon class="text-[1.25rem] w-[1.25rem] h-[1.25rem] lg:text-[1.75rem] lg:w-[1.75rem] lg:h-[1.75rem]" scale={0} icon=check></Icon>
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