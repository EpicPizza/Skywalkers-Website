<script lang=ts>
    import List from './List.svelte';
    import RolePermission from './RolePermission.svelte';
    import Discord from './Discord.svelte';
    import { getContext, onDestroy, onMount } from "svelte";
    import { type Role, deleteRole, type DiscordRole } from "./role";
    import Icon from "$lib/Builders/Icon.svelte";
    import DeleteDialog from "./DeleteDialog.svelte";
    import { beforeNavigate, goto } from "$app/navigation";
    import EditDialog from "./EditDialog.svelte";
    import { page as pageStore } from '$app/stores';
    import Line from "$lib/Builders/Line.svelte";
    import { fly, slide } from 'svelte/transition';
    import { bounceIn, bounceInOut, cubicInOut,  } from 'svelte/easing';
    import { browser } from '$app/environment';
    import Loading from '$lib/Builders/Loading.svelte';
    import type { firebaseClient } from '$lib/Firebase/firebase';
    import type { Writable } from 'svelte/store';

    let client = getContext('client') as ReturnType<typeof firebaseClient>;
    let sidebar = getContext('sidebar') as Writable<boolean>;
    let clicked = getContext('clicked') as Writable<boolean>;

    export let role: Role;
    export let discord: Promise<DiscordRole[]>;

    let page: HTMLDivElement

    onMount(() => {
        page.onclick = () => {
            clicked.update(n => !n); 
        }
    })

    function hexToRgb(hex: string) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    let name = "";

    let permissions: string[] = [];

    let originalPermissions: string[] = [];

    $: {
        if(name != role.name) {
            openList = false;
            openDelete = false;
            openEdit = false;
            if(page) (page.parentNode as HTMLElement).style.overflowY = "";
            name = role.name;
            permissions = structuredClone(role.permissions);
            originalPermissions = structuredClone(role.permissions);
        }
    }

    beforeNavigate((event) => {
        if(tainted && !confirm("You have unsaved permission changes! Are you sure want to leave this page?")) {
            event.cancel();
        }
    })

    $: showChanges(role.permissions);

    function showChanges(newPermissions: string[]) {
        let difference = false;
        if(newPermissions.length == originalPermissions.length) {
            for(let i = 0; i < originalPermissions.length; i++) {
                if(!newPermissions.includes(originalPermissions[i])) {
                    difference = true;
                }
            }
        } else {
            difference = true;
        }

        if(difference && !tainted) {
            permissions = structuredClone(newPermissions);
            originalPermissions = structuredClone(newPermissions);
        }
    }

    let tainted = false;

    $: {
        if(permissions.length == originalPermissions.length) {
            let difference = false;

            for(let i = 0; i < originalPermissions.length; i++) {
                if(!permissions.includes(originalPermissions[i])) {
                    difference = true;
                }
            }

            tainted = difference;
        } else {
            tainted = true;
        }
    }

    $: rgb = hexToRgb(role.color) ?? { r: 0, g: 0, b: 0};

    function rgbToTextColor(color: { r: number, g: number, b: number }) {
        return (color.r * 0.299 + color.g * 0.587 + color.b * 0.114) > 120;
    }

    $: mode = rgbToTextColor(rgb);

    let openDelete = false;

    let handlingDelete = false;

    async function handleDelete() {
        if(handlingDelete) return;

        handlingDelete = true;

        await deleteRole(role.id);

        $sidebar = true;

        (page.parentNode as HTMLElement).style.overflowY = "";

        await goto("/settings/roles");

        handlingDelete = false;
    }

    let openEdit = false;

    $: everyone = role.name === 'everyone';

    let form = $pageStore.data.forms.edit; //since this component can be loaded in different directories, i just make sure in each directory this is being loaded in, the form is passed to the data prop.

    let openList = false;

    function handleListClick() {
        if(tainted) {
            if(!confirm("You have unsaved permission changes! Are you sure want to leave this page?")) {
                return;
            } else {
                permissions = structuredClone(role.permissions);
                originalPermissions = structuredClone(role.permissions);   
            }
        }

        openList = !openList;

        if(openList == true) {
            (page.parentNode as HTMLElement).scrollTo({ top:0, behavior: "smooth" });

            (page.parentNode as HTMLElement).style.overflowY = "hidden";
        } else {
            (page.parentNode as HTMLElement).style.overflowY = "";
        } 
    }

    let loadingSave = false;

    async function handleSave() {
        if(loadingSave) return;
    
        loadingSave = true;

        originalPermissions = [... permissions];
        role.permissions = [... permissions];

        await fetch("/api/roles/edit", {
            method: 'POST',
            body: JSON.stringify({
                permissions: permissions,
                role: role.id,
            })
        });

        await new Promise((resolve) => {
            setTimeout(() => {
                resolve(0);
            }, 500);
        })

        loadingSave = false;
    }

    onDestroy(() => {
        if(page) (page.parentNode as HTMLElement).style.overflowY = "";
    })
</script>

{#if !everyone}
    <DeleteDialog bind:open={openDelete} {role} on:delete={handleDelete}></DeleteDialog>
    <EditDialog bind:open={openEdit} {role} {form}></EditDialog>
{/if}

<div bind:this={page} class="w-full relative">
    <div style="background-color: {role.color};" class="w-full h-24 relative">
        {#if !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('MANAGE_ROLES') || $client.level == undefined || $client.level <= role.level)}
            <button on:click={() => { openDelete = !openDelete }} class="m-2 p-2 {everyone ? "hidden" : "block"} absolute right-0 top-0 rounded-full bg-opacity-10 hover:bg-opacity-20 transition {mode ? "text-black bg-black" : "text-white bg-white"}">
                <Icon icon=delete></Icon>
            </button>
            <button on:click={() => { openEdit = !openEdit }} class="m-2 p-2 absolute right-12 {everyone ? "hidden" : "block"} top-0 rounded-full bg-opacity-10 hover:bg-opacity-20 transition {mode ? "text-black bg-black" : "text-white bg-white"}">
                <Icon icon=edit></Icon>
            </button>
        {/if}
        <button on:click={handleListClick} class="m-2 p-2 absolute {$client == undefined || $client.permissions == undefined || !$client.permissions.includes('MANAGE_ROLES') || $client.level == undefined || $client.level <= role.level ? "right-0" : "right-24"} {everyone ? "hidden" : "block"} top-0 rounded-full {openList ? "bg-opacity-20" : "bg-opacity-10" } hover:bg-opacity-20 transition {mode ? "text-black bg-black" : "text-white bg-white"}">
            <Icon icon=group></Icon>
        </button>
    </div>
    {#if openList}
        <List {role}></List>
    {/if}
    <div class="p-8 pb-3 pt-5">
        <h1 class="text-2xl font-bold mb-4">{role.name}</h1>

        {#if everyone}
            <p class="mb-6">Anyone who is verified automatically gets the permissions given in this section. This role cannot be renamed, deleted, or moved, and this role is not visible on profiles.</p>
        {:else}
            <p class="mb-6">Depending on permissions, members may or may not be able to perform actions on higher level members.</p>
        {/if}

        {#if !everyone}
            <Line class="mb-4"></Line>

            <h2 class="uppercase text-sm opacity-75 mb-4">discord integration</h2>

            <div class="mb-6 flex justify-between items-center">
                <p>Connected to:</p>
                <Discord {discord} {role}></Discord>
            </div>
        {/if}

        <Line class="mb-4"></Line>

        <h2 class="uppercase text-sm opacity-75 mb-6">general permissions</h2>

        <RolePermission permission=MANAGE_CODES bind:permissions {role}>
            <svelte:fragment slot=title>
                Manage Codes
            </svelte:fragment>
            <svelte:fragment slot=description>
                Members will be able to generate (and delete) codes that new users can use to join the team.
            </svelte:fragment>
        </RolePermission>

        <RolePermission permission=KICK_MEMBERS bind:permissions {role}>
            <svelte:fragment slot=title>
                Kick Members
            </svelte:fragment>
            <svelte:fragment slot=description>
                Members will be able to kick any person below their level.
            </svelte:fragment>
        </RolePermission>

        <RolePermission permission=EDIT_PROFILE bind:permissions {role}>
            <svelte:fragment slot=title>
                Edit Profile
            </svelte:fragment>
            <svelte:fragment slot=description>
                Members will be able to edit their name, pronouns, and profile picture.
            </svelte:fragment>
        </RolePermission>

        <RolePermission permission=MODERATE_PROFILES bind:permissions {role}>
            <svelte:fragment slot=title>
                Moderate Profiles
            </svelte:fragment>
            <svelte:fragment slot=description>
                Members will be able to edit other members' name, pronouns, and profile picture.
            </svelte:fragment>
        </RolePermission>

        <Line class="mb-4"></Line>

        <h2 class="uppercase text-sm opacity-75 mb-6">role permissions</h2>

        <RolePermission permission=MANAGE_ROLES bind:permissions {role}>
            <svelte:fragment slot=title>
                Manage Roles
            </svelte:fragment>
            <svelte:fragment slot=description>
                Members will be able to edit/create/delete/add roles below their level, this is dangerous since they can give themselves any permission.
            </svelte:fragment>
        </RolePermission>

        <Line class="mb-4"></Line>

        <h2 class="uppercase text-sm opacity-75 mb-6">meeting permissions</h2>

        <RolePermission permission=VIEW_MEETINGS bind:permissions {role}>
            <svelte:fragment slot=title>
                View Meetings
            </svelte:fragment>
            <svelte:fragment slot=description>
                Members will be able to view all available meetings and sign up up for them.
            </svelte:fragment>
        </RolePermission>

        <RolePermission permission=EDIT_MEETINGS bind:permissions {role}>
            <svelte:fragment slot=title>
                Edit Meetings
            </svelte:fragment>
            <svelte:fragment slot=description>
                Members will be able to edit upcoming meetings.
            </svelte:fragment>
        </RolePermission>

        <RolePermission permission=CREATE_MEETINGS bind:permissions {role}>
            <svelte:fragment slot=title>
                Create Meetings
            </svelte:fragment>
            <svelte:fragment slot=description>
                Members will be able to create upcoming meetings. They will also be able to edit/delete meetings they create.
            </svelte:fragment>
        </RolePermission>

        <RolePermission permission=DELETE_MEETINGS bind:permissions {role}>
            <svelte:fragment slot=title>
                Delete Meetings
            </svelte:fragment>
            <svelte:fragment slot=description>
                Members will be able to delete upcoming meetings.
            </svelte:fragment>
        </RolePermission>

        <RolePermission permission=LEAVE_SIGNUP bind:permissions {role}>
            <svelte:fragment slot=title>
                Leave Signups
            </svelte:fragment>
            <svelte:fragment slot=description>
                Without this permission, members will not be able to remove themselves if they sign up for a meeting.
            </svelte:fragment>
        </RolePermission>

        <RolePermission permission=MODERATE_MEETINGS bind:permissions {role}>
            <svelte:fragment slot=title>
                Moderate Meetings
            </svelte:fragment>
            <svelte:fragment slot=description>
                Moderators will be able to remove any sign ups from a meeting.
            </svelte:fragment>
        </RolePermission>

        <Line class="mb-4"></Line>

        <h2 class="uppercase text-sm opacity-75 mb-6">synopsis permissions</h2>

        <RolePermission permission=ADD_SYNOPSES bind:permissions {role}>
            <svelte:fragment slot=title>
                Add Synopses
            </svelte:fragment>
            <svelte:fragment slot=description>
                Members will be able to add a synopsis to any meeting, also marking them complete.
            </svelte:fragment>
        </RolePermission>

        <RolePermission permission=EDIT_SYNOPSES bind:permissions {role}>
            <svelte:fragment slot=title>
                Edit Synopses
            </svelte:fragment>
            <svelte:fragment slot=description>
                Members will be able to edit a synopsis from any meeting.
            </svelte:fragment>
        </RolePermission>

        <RolePermission permission=MODERATE_SYNOPSES bind:permissions {role}>
            <svelte:fragment slot=title>
                Moderate Synopses
            </svelte:fragment>
            <svelte:fragment slot=description>
                Members will be able to reject/delete a synopsis to any meeting, also marking them as active again.
            </svelte:fragment>
        </RolePermission>
    </div>
    {#if tainted || loadingSave}
        <div transition:fly={{ easing: cubicInOut, y: 100 }} class="sticky bottom-0 w-full pointer-events-none p-5 pt-0">
            <div class="p-3 w-full flex items-center justify-between rounded-lg pointer-events-auto bg-zinc-100 dark:bg-zinc-900 border-border-light dark:border-border-dark border-[1px] shadow-shadow-light dark:shadow-shadow-dark shadow-lg">
                <p class="ml-1">You have unsaved permissions.</p>
                <div class="flex">
                    <button class="b-secondary" on:click={() => {
                        permissions = structuredClone(role.permissions);
                        originalPermissions = structuredClone(role.permissions);
                    }}>Cancel</button>
                    <button on:click={handleSave} class="b-primary ml-2 w-[53.5px] flex justify-around">
                        {#if loadingSave}
                            <div class="scale-[0.7] flex items-center h-[1.5rem]">
                                <Loading clear></Loading>
                            </div>
                        {:else}
                            Save
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>