<script lang=ts>
    import { browser } from "$app/environment";
    import { navigating, page } from "$app/stores";
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Tooltip from "$lib/Builders/Tooltip.svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import type { createMode, createVerified }  from "$lib/stores";
    import { Menu, MenuButton} from "@rgossiaux/svelte-headlessui";
    import { getContext, onMount } from "svelte";
    import type { Writable } from "svelte/store";
    import { createDropdownMenu, melt } from '@melt-ui/svelte';
    import { writable } from 'svelte/store';
    import { fly } from 'svelte/transition';
    import { goto } from "$app/navigation";
    import NewDialog from "$lib/Builders/NewDialog.svelte";
    
    const settingsSync = writable(true);
    const hideMeltUI = writable(false);
    const dev = getContext('dev') as Writable<boolean>;
    const global = getContext('global') as Writable<boolean>;
    const client = getContext('client') as ReturnType<typeof firebaseClient>;
    const teamInfo = getContext('teamInfo') as Writable<Map<string, { name: string, website: string, icon: string }>>

    const {
        elements: { trigger, menu, item, separator, arrow },
        builders: { createSubmenu, createMenuRadioGroup, createCheckboxItem },
        states: { open },
    } = createDropdownMenu({
        forceVisible: true,
        loop: true,
    });
    
    const {
        elements: { subMenu, subTrigger },
        states: { subOpen },
    } = createSubmenu();

    let navmenu = getContext('navmenu') as Writable<boolean>;
    let navmode = getContext('navmode') as Writable<boolean>;
    let previous = getContext('previous') as Writable<string | undefined>;
    let verified = getContext('verified') as ReturnType<typeof createVerified>;

    let mode = getContext('mode') as ReturnType<typeof createMode>;
    let user = getContext('client') as ReturnType<typeof firebaseClient>;
    let team = getContext('team') as Writable<string>;

    onMount(() => {
        const unsubsribe = navmode.subscribe(() => {
            $open = false;
        });

        return () => {
            unsubsribe();
        }
    });

    let dialogOpen = writable(false);
</script>

{#if $user == undefined}
    {#if !($page.url.pathname.includes("/help") || $page.url.pathname.includes("/account"))}
        <button disabled class="b-bold whitespace-nowrap">Signed Out</button>
    {:else}
        <a href="/" class="b-bold whitespace-nowrap">Signed Out</a>
    {/if}
{:else if typeof $user == 'object'}
        <button use:melt={$trigger} class="flex flex-row-reverse">
            <div class="flex flex-row items-center">
                {#if $page.data.kicked}
                    <a href="/help/kicked" on:click|stopPropagation={() => {}} class="bg-opacity-30 dark:bg-opacity-20 bg-red-500 dark:text-red-500 text-red-900 p-1 px-2.5 text-lg rounded-md mr-2">Kicked</a>
                {/if}
                <img referrerpolicy="no-referrer" alt="profile" src="{$user.photoURL}" class="h-10 w-10 min-w-[2.5rem] rounded-full">
            </div>
        </button>
        {#if $open}
            <div use:melt={$menu} class="bg-backgroud-light w-72 dark:bg-backgroud-dark border-border-light dark:border-border-dark z-[50] shadow-shadow-light dark:shadow-shadow-dark shadow-lg translate-y-2  right-2 box-border border-[1px] rounded-lg flex-col p-2 {$dialogOpen ? "hidden" : "flex"}">
                <div class="p-2 py-1 rounded-t-md rounded-sm cursor-default max-w-full">
                    <div class="flex flex-row items-center overflow-hidden max-w-full">
                        <img referrerpolicy="no-referrer" alt="profile" src="{$user.photoURL}" class="h-14 w-14 rounded-full">
                        <div class="ml-3 mr-1 max-w-[11.5rem]">
                            <p class="overflow-ellipsis overflow-hidden whitespace-nowrap">{$user.displayName}{$user.pronouns != undefined && $user.pronouns != "" ? " (" + $user.pronouns + ")": ""}</p>
                            <p class="overflow-ellipsis overflow-hidden whitespace-nowrap opacity-75">{$user.email}</p>
                        </div>
                    </div>
                </div>
                <Line class="my-2"/>
                <div class="flex flex-row">
                    <Tooltip text="Sign Out" class="w-full">
                        <button use:melt={$item} on:click={() => { user.signOut() }} class="hover:cursor-pointer rounded-md b-menu w-full flex justify-around items-center">
                            <Icon icon=logout scale=1.75rem></Icon>
                        </button>
                    </Tooltip>
                    <Tooltip text="Sign Out of All Devices" class="w-full">
                        <button use:melt={$item} on:click={() => { user.reset() }} class="hover:cursor-pointer {window.location.pathname == "/settings/profile/" ? "hover:after:opacity-0" : ""} rounded-md b-menu w-full flex justify-around items-center">
                            <Icon icon=lock_reset scale=1.75rem></Icon>
                        </button>
                    </Tooltip>
                    <Tooltip text="Edit Profile" class="w-full">
                        <button use:melt={$item} on:click={() => { goto(window.location.pathname == "/account/profile" || $client?.teams == undefined ? "/" : "/account/profile"); }} on:click={() => { $previous = window.location.pathname; }} disabled={window.location.pathname == "/account/profile" || $client?.teams == undefined} class="{window.location.pathname == "/account/profile" || $client?.teams == undefined ? "hover:cursor-not-allowed hover:bg-opacity-0 dark:hover:bg-opacity-0 opacity-50 dark:opacity-50" : "hover:cursor-pointer"} rounded-md b-menu w-full flex justify-around items-center">
                            <Icon icon=badge scale=1.75rem></Icon>
                        </button>
                    </Tooltip>
                </div>
                <Line class="my-2"/>
                {#if $client != undefined && $client.teams != undefined}
                    {#if $navmode}
                        <div use:melt={$subTrigger} class="rounded-md b-menu">
                            Switch Team
                        </div>
                        {#if $subOpen}
                            <div
                                class="bg-backgroud-light w-48 dark:bg-backgroud-dark border-border-light dark:border-border-dark z-[50] shadow-shadow-light dark:shadow-shadow-dark shadow-lg translate-x-1 -translate-y-2 box-border border-[1px] rounded-lg flex-col flex p-2"
                                use:melt={$subMenu}
                            >
                                {#each $client.teams ?? [] as teamOption}
                                    {@const info = $teamInfo.get(teamOption.team)}
                                    {#if info}
                                        <a href="/t/{teamOption.team}" class="rounded-md b-menu flex items-center">
                                            <img class="w-6 h-6 -translate-x-1 rounded-md" src="{info.icon}">
                                            <p class="ml-1">{info.name}</p>
                                            {#if $team == teamOption.team && !$global}
                                                <Icon icon=check class="ml-auto" scale=1.4rem></Icon>
                                            {/if}
                                        </a>
                                    {:else}
                                        <a target="__blank" href="/t/{teamOption.team}" class="rounded-md b-menu flex items-center">
                                            <img class="w-6 h-6 -translate-x-1 rounded-md" src="/favicon.webp">
                                            <p class="ml-1">{teamOption.team}</p>
                                            {#if $team == teamOption.team && !$global}
                                                <Icon icon=check class="ml-auto" scale=1.4rem></Icon>
                                            {/if}
                                        </a>
                                    {/if}
                                {/each}
                                <!--<button disabled={true} class="rounded-md b-menu flex mt-1 items-center opacity-50 hover:bg-opacity-0 dark:hover:bg-opacity-0 hover:disabled:cursor-not-allowed">
                                    <Icon icon=add class="-translate-x-0.5" scale=1.4rem></Icon>
                                    <p class="ml-1.5">Join Team</p>
                                </button>-->
                            </div>
                        {/if}
                    {:else}
                        <NewDialog title="Switch Team" size="250px" bind:open={dialogOpen} class="text-left rounded-md b-menu">
                            <svelte:fragment slot="button">
                                Switch Team
                            </svelte:fragment>
                            <p slot="content">
                                {#each $client.teams ?? [] as teamOption}
                                    {@const info = $teamInfo.get(teamOption.team)}
                                    {#if info}
                                        <a href="/t/{teamOption.team}" class="bg-black dark:bg-white bg-opacity-5 dark:bg-opacity-5 transition p-2 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md w-full h-full flex items-center px-2 mt-2">
                                            <img class="w-6 h-6 rounded-md" src="{info.icon}">
                                            <p class="ml-2">{info.name}</p>
                                            {#if $team == teamOption.team && !$global}
                                                <Icon icon=check class="ml-auto" scale=1.4rem></Icon>
                                            {/if}
                                        </a>
                                    {:else}
                                        <a target="__blank" href="/t/{teamOption.team}" class="bg-black dark:bg-white bg-opacity-5 dark:bg-opacity-5 transition p-2 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md w-full h-full flex items-center px-2 mt-2">
                                            <img class="w-6 h-6 rounded-md" src="/favicon.webp">
                                            <p class="ml-2">{teamOption.team}</p>
                                            {#if $team == teamOption.team && !$global}
                                                <Icon icon=check class="ml-auto" scale=1.4rem></Icon>
                                            {/if}
                                        </a>
                                    {/if}
                                {/each}
                            </p>
                        </NewDialog>
                    {/if}
                {/if}
                {#if $verified}
                    <a use:melt={$item} href="/t/{$team}/settings" class="rounded-md b-menu">
                        Team Settings
                    </a>
                {/if}
                <a use:melt={$item} href="/account" class="rounded-md b-menu">
                    Your Account
                </a>
                {#if $dev}
                    <button use:melt={$item} on:click={() => { navigator.clipboard.writeText($client?.uid ?? "NO UID") }} class="text-left rounded-md b-menu">
                        Copy ID
                    </button>
                {/if}
            </div>
        {/if}
{/if}

<style lang=postcss>
    hr {
        @apply my-2 border-zinc-200 dark:border-zinc-700;
    }
</style>