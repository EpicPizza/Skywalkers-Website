<script lang=ts>
    import Background from "$lib/Builders/Background.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Page from "$lib/Builders/Page.svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import { getContext } from "svelte";

    let client = getContext('client') as ReturnType<typeof firebaseClient>;
</script>

<svelte:head>
    <title>Skywalkers | Team Settings</title>
</svelte:head>

<Background>
    <Page>
        <h1 class="text-2xl font-bold">Team Settings</h1>
        <Line class="my-4 mt-2"></Line>
        <a href="/settings/roles" class="flex p-8 py-4 mb-3 gap-4 items-center rounded-lg bg-black dark:bg-white bg-opacity-5 dark:bg-opacity-5 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition cursor-pointer">
            <Icon icon=group scale=2.5rem></Icon>
            <div class="ml-4">
                <h2 class="mb-1 text-xl">Roles and Permissions</h2>
                <h3 class="opacity-75">Create, delete, and edit roles here. List, add, and remove members from specific roles here too.</h3>
            </div>
        </a>
        <a href="/settings/members" class="flex p-8 py-4 {!($client == undefined || $client.permissions == undefined || !$client.permissions.includes('MANAGE_CODES')) ? "mb-3" : ""} gap-4 items-center rounded-lg bg-black dark:bg-white bg-opacity-5 dark:bg-opacity-5 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition cursor-pointer">
            <Icon icon=workspaces scale=2.5rem></Icon>
            <div class="ml-4">
                <h2 class="mb-1 text-xl">Team Member List</h2>
                <h3 class="opacity-75">View all team members. Edit roles and profiles of members. Kick and unkick members.</h3>
            </div>
        </a>
        {#if !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('MANAGE_CODES'))}
            <a href="/settings/codes" class="flex p-8 py-4 gap-4 items-center rounded-lg bg-black dark:bg-white bg-opacity-5 dark:bg-opacity-5 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition cursor-pointer">
                <Icon icon=vpn_key scale=2.5rem></Icon>
                <div class="ml-4">
                    <h2 class="mb-1 text-xl">Verification Codes and Links</h2>
                    <h3 class="opacity-75">View verification codes and links. Edit and add codes/links. Restrict codes/links to emails.</h3>
                </div>
            </a>
        {/if}
    </Page>
</Background>