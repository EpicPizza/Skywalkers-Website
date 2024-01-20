<script lang=ts>
    import Background from "$lib/Builders/Background.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Page from "$lib/Builders/Page.svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import type { createCurrentTeam } from "$lib/stores";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import { page } from '$app/stores';
    import KickMember from "$lib/Members/KickMember.svelte";
    import OnDestory from '$lib/Members/OnDestroy.svelte';

    export let data;

    let client = getContext('client') as ReturnType<typeof firebaseClient>;
    let permissions = getContext('permissions') as Writable<string[]>;
    let team = getContext('team') as Writable<string>;
    let teamInfo = getContext('teamInfo') as Writable<Map<string, { name: string, website: string, icon: string }>>
    let currentTeam = getContext('currentTeam') as ReturnType<typeof createCurrentTeam>;

    $: info = $teamInfo.get($page.params.team == undefined ? ($currentTeam ? $currentTeam.team : "000000") : $page.params.team);
</script>

<svelte:head>
    <title>{info?.name ?? "Skywalkers"} | Team Settings</title>
</svelte:head>

<Background>
    <Page>
        <h1 class="text-2xl font-bold">Team Settings</h1>
        <Line class="my-4 mt-2"></Line>
        <a href="/t/{$team}/settings/roles" class="flex p-8 py-4 mb-3 gap-4 items-center rounded-lg bg-black dark:bg-white bg-opacity-5 dark:bg-opacity-5 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition cursor-pointer">
            <Icon icon=group scale=2.5rem></Icon>
            <div class="ml-4">
                <h2 class="mb-1 text-xl">Roles and Permissions</h2>
                <h3 class="opacity-75">Create, delete, and edit roles here. List, add, and remove members from specific roles here too.</h3>
            </div>
        </a>
        {#if $permissions.includes('MANAGE_CODES')}
            <a href="/t/{$team}/settings/invites" class="flex p-8 py-4 gap-4 mb-3 items-center rounded-lg bg-black dark:bg-white bg-opacity-5 dark:bg-opacity-5 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition cursor-pointer">
                <Icon icon=vpn_key scale=2.5rem></Icon>
                <div class="ml-4">
                    <h2 class="mb-1 text-xl">Invites</h2>
                    <h3 class="opacity-75">Invite people to the team with their email and edit their invitations.</h3>
                </div>
            </a>
        {/if}
        {#if $permissions.includes('VIEW_LOGS')}
            <a href="/t/{$team}/logs" class="flex p-8 py-4 gap-4 mb-3 items-center rounded-lg bg-black dark:bg-white bg-opacity-5 dark:bg-opacity-5 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition cursor-pointer">
                <Icon icon=feed scale=2.5rem></Icon>
                <div class="ml-4">
                    <h2 class="mb-1 text-xl">Website Logs</h2>
                    <h3 class="opacity-75">View logs about who and when regarding meetings, role, codes, etc.</h3>
                </div>
            </a>
        {/if}
        <a href="/t/{$team}/settings/members" class="flex p-8 py-4 mb-3 gap-4 items-center rounded-lg bg-black dark:bg-white bg-opacity-5 dark:bg-opacity-5 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition cursor-pointer">
            <Icon icon=workspaces scale=2.5rem></Icon>
            <div class="ml-4">
                <h2 class="mb-1 text-xl">Team Member List</h2>
                <h3 class="opacity-75">View all team members. Edit roles and profiles of members. Kick and unkick members.</h3>
            </div>
        </a>
        {#if $client && $client.teams != undefined}
            <KickMember isKicking={false} form={data.kickForm} let:handleKickMember member={$client.uid}>
                <button on:click={handleKickMember} class="flex p-8 py-4 gap-4 items-center rounded-lg bg-red-500 dark:bg-red-500 bg-opacity-10 dark:bg-opacity-10 hover:bg-opacity-20 dark:hover:bg-opacity-20 transition cursor-pointer">
                    <Icon icon=logout scale=2.5rem></Icon>
                    <div class="ml-4">
                        <h2 class="mb-1 text-xl text-left">Leave Team</h2>
                        <h3 class="opacity-75 text-left">All your data in this team will be deleted such as hours, roles, and permissions.</h3>
                    </div>
                </button>
            </KickMember>
            <OnDestory></OnDestory>
        {/if}
    </Page>
</Background>