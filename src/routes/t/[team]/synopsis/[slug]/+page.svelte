<script lang=ts>
    import Icon from '$lib/Builders/Icon.svelte';
    import format from 'date-and-time';
    import meridiem from 'date-and-time/plugin/meridiem';
    import Line from '$lib/Builders/Line.svelte';
    import type { FirestoreUser, firebaseClient } from '$lib/Firebase/firebase.js';
    import { getContext } from 'svelte';
    import Markdown from '$lib/Markdown/Markdown.svelte';
    import { JustifiedGrid } from "@egjs/svelte-grid";
    import Image from './Image.svelte';
    import type { Writable } from 'svelte/store';
    import type { createCurrentTeam, createPermissions } from '$lib/stores';
    import { page } from '$app/stores'

    format.plugin(meridiem);

    export let data;

    let team = getContext('team') as Writable<string>;
    
    let client = getContext('client') as ReturnType<typeof firebaseClient>;
    let permissions = getContext('permissions') as ReturnType<typeof createPermissions>;

    function checkIfImage(type: string) {
        switch(type) {
            case 'image/apng':
            case 'image/avif':
            case 'image/gif':
            case 'image/jpeg':
            case 'image/png':
            case 'image/svg+xml':
            case 'image/webp':
                return true;
            default:
                return false;
        }
    }

    let photos: (typeof data)["synopsis"]["attachments"] = [];
    let files: (typeof data)["synopsis"]["attachments"] = [];

    for(let i = 0; i < data.synopsis.attachments.length; i++) {
        if(checkIfImage(data.synopsis.attachments[i].type)) {
            photos.push(data.synopsis.attachments[i]);
        } else {
            files.push(data.synopsis.attachments[i]);
        }
    }

    let loading: string[] = [];
    let running: string[] = [];

    function addLoader(url: string) {
        loading.push(url);
        loading = loading;
    }

    async function download(url: string, name: string) {
        if(running.indexOf(url) != -1) return;

        setTimeout(function () {
            if(running.indexOf(url) != -1) {
                addLoader(url);
            }
        }, 500);

        running.push(url);

        const blob = await fetch(url).then((res) => res.blob());
        const blobUrl = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.download = name;
        a.href = blobUrl;
        a.target = "_blank";

        a.click();

        if(running.indexOf(url) != -1) {
            running.splice(running.indexOf(url), 1);
        }

        if(loading.indexOf(url) != -1) {
            loading.splice(loading.indexOf(url), 1);
            loading = loading;
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
    <title>{info?.name ?? "Skywalkers"} | Synopsis</title>
</svelte:head>

<div class="min-h-[calc(100dvh)] p-8 pt-[88px] flex justify-around">
    <div class="w-[36rem] max-w-[36rem] lg:w-[44rem] lg:max-w-[44rem] overflow-clip">
        <div class="w-full flex justify-between">
            <a href="/meetings/{data.meeting.id}" class="flex gap-1 p-1 mb-2 pr-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition lg:text-lg">
                <Icon scale={0} class="text-[1.25rem] w-[1.25rem] h-[1.25rem] lg:text-[1.5rem] lg:w-[1.5rem] lg:h-[1.5rem]" icon=arrow_back></Icon>
                <p>Back</p>
            </a>
        </div>
        <div class="sticky top-24 z-10">
            <div class="p-4 lg:p-6 bg-accent-500 text-black rounded-2xl flex items-center">
                {#if data.meeting.thumbnail.startsWith("icon:")}
                    <Icon scale={0} class="text-[4rem] w-[4rem] h-[4rem] lg:text-[5rem] lg:w-[5rem] lg:h-[5rem]" icon={data.meeting.thumbnail.substring(5, data.meeting.thumbnail.length)}/>
                {/if}
                <div class="ml-4 lg:ml-5">
                    <div class="text-2xl lg:text-3xl lg:mb-1">Synopsis for {data.meeting.name}</div>
                    <div class="text-lg lg:text-xl opacity-80">At {data.meeting.location}</div>
                </div>
            </div>
        </div>
        <Markdown content={data.synopsis.body}/>
        <JustifiedGrid columnRange={2} gap={10}>
            {#each photos as attachment}
                <Image name={attachment.name} url={attachment.url}></Image>
            {/each}
        </JustifiedGrid>
        {#if data.synopsis.attachments.length == 0}
            <div class="mb-4"></div>
        {/if}
        {#each files as attachment}
            <div class="inline-flex bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10 p-2 px-3 rounded-lg w-fit items-center gap-2 mb-2 mr-2 max-w-full overflow-x-auto">
                <button on:click={() => { download(attachment.url, attachment.name + "." + attachment.ext); }}>
                    {#if loading.includes(attachment.url)}
                        <div class="w-5 h-5 mx-0.5 rounded-full border-[3px] border-t-black dark:border-t-white border-b-transparent border-l-transparent border-r-transparent animate-spin"></div>
                    {:else}
                        <Icon icon=download></Icon>
                    {/if}
                </button>
                <p>{attachment.name}</p>
                <p class="p-1 px-3 rounded-full bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10">{attachment.ext}</p>
            </div>
        {/each}
        <div class="my-4 p-4 lg:p-6 border-border-light dark:border-border-dark border-[1px] rounded-2xl">
            <div class="gap-4 flex flex-col">
                {#each data.synopsis.hours as entry}
                    {@const role = getRole(entry.member)}
                    <div class="flex items-center gap-2.5 {entry.time == 0 ? "opacity-25" : ""}">
                        <img class="h-8 w-8 lg:h-9 lg:w-9 rounded-full" alt="{entry.member.displayName}{entry.member.pronouns == "" ? "" : " (" + entry.member.pronouns + ")"}'s Profile" src={entry.member.photoURL}/>
                        <p class="text-lg lg:text-xl grow overflow-hidden whitespace-nowrap overflow-ellipsis {entry.member.photoURL == '/unknown.webp' ? "italic" : ""}">{entry.member.displayName}{entry.member.pronouns == "" ? "" : " (" + entry.member.pronouns + ")"}</p>
                        {#if role == 'student'}
                            <a href="/hours/{entry.member.id}" class="bg-black  dark:bg-white bg-opacity-10 ml-1 text-center text-lg dark:bg-opacity-10 p-1 px-2 rounded-lg">{entry.time} hour{entry.time == 1 ? "" : 's'}</a>
                        {/if}
                    </div>
                {:else}
                    <div class="flex justify-around">
                        <p>No Members Participated</p>
                    </div>
                {/each}
            </div>  
        </div>
        <div class="flex flex-row-reverse gap-2">
            {#if $permissions.includes('EDIT_SYNOPSES')}
                <a href="/synopsis/{data.meeting.id}/edit" class="b-secondary lg:text-lg flex gap-1 items-center"><Icon scale=1.25rem icon=edit/><span>Edit</span></a>
            {/if}
            {#if $permissions.includes('MODERATE_SYNOPSES')}
                <a href="/synopsis/{data.meeting.id}/reject" class="b-secondary lg:text-lg flex gap-1 items-center"><Icon scale=1.25rem icon=cancel/><span>Reject</span></a>
            {/if}
        </div>
    </div>
</div>