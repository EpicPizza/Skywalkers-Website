<script lang=ts>
    import { browser } from "$app/environment";
    import { navigating, page } from "$app/stores";
import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Tooltip from "$lib/Builders/Tooltip.svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import { sidebar } from "$lib/Roles/role";
    import type { createMode, createVerified }  from "$lib/stores";
    import { Menu, MenuButton, MenuItem, MenuItems } from "@rgossiaux/svelte-headlessui";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";

    let navmenu = getContext('navmenu') as Writable<boolean>;
    let navmode = getContext('navmode') as Writable<boolean>;
    let previous = getContext('previous') as Writable<string | undefined>;
    let verified = getContext('verified') as ReturnType<typeof createVerified>;

    let mode = getContext('mode') as ReturnType<typeof createMode>;
    let user = getContext('client') as ReturnType<typeof firebaseClient>;
</script>

{#if $user == undefined}
    {#if !$page.url.pathname.includes("/help")}
        <button disabled class="b-bold whitespace-nowrap">Signed Out</button>
    {:else}
        <a href="/" class="b-bold whitespace-nowrap">Signed Out</a>
    {/if}
{:else if typeof $user == 'object'}
    <Menu class="h-auto">
        <MenuButton class="flex flex-row-reverse">
            <div class="flex flex-row items-center">
                {#if $page.data.kicked}
                    <a href="/help/kicked" on:click|stopPropagation={() => {}} class="bg-opacity-30 dark:bg-opacity-20 bg-red-500 dark:text-red-500 text-red-900 p-1 px-2.5 text-lg rounded-md mr-2">Kicked</a>
                {/if}
                <img referrerpolicy="no-referrer" alt="profile" src="{$user.photoURL}" class="h-10 w-10 rounded-full">
            </div>
        </MenuButton>
        <MenuItems class="bg-backgroud-light absolute dark:bg-backgroud-dark border-border-light dark:border-border-dark shadow-shadow-light dark:shadow-shadow-dark shadow-lg translate-y-2 {$navmode == true ? 'right-2' : 'right-0'} box-border border-[1px] rounded-lg overflow-y-auto flex-col flex p-2 max-w-none">
            <MenuItem disabled href="/settings" class="p-2 py-1 rounded-t-md rounded-sm cursor-default">
                <div class="flex flex-row items-center">
                    <img referrerpolicy="no-referrer" alt="profile" src="{$user.photoURL}" class="h-14 w-14 rounded-full">
                    <div class="ml-3">
                        <p>{$user.displayName}{$user.pronouns != undefined && $user.pronouns != "" ? " (" + $user.pronouns + ")": ""}</p>
                        <p class="opacity-75">{$user.email}</p>
                    </div>
                </div>
            </MenuItem>
            <Line class="my-2 mx-1"/>
            <div class="flex flex-row">
                <Tooltip text="Sign Out" class="w-full">
                    <MenuItem on:click={() => { $navmenu = false; user.signOut() }} class="hover:cursor-pointer rounded-md b-menu w-full flex justify-around items-center">
                        <Icon icon=logout scale=1.75rem></Icon>
                    </MenuItem>
                </Tooltip>
                <Tooltip text="Sign Out of All Devices" class="w-full">
                    <MenuItem on:click={() => { $navmenu = false; user.reset() }} class="hover:cursor-pointer {window.location.pathname == "/settings/profile/" ? "hover:after:opacity-0" : ""} rounded-md b-menu w-full flex justify-around items-center">
                        <Icon icon=lock_reset scale=1.75rem></Icon>
                    </MenuItem>
                </Tooltip>
                <Tooltip text="Edit Profile" class="w-full">
                    <MenuItem on:click={() => { $navmenu = false; }} href={ window.location.pathname == "/settings/profile" || $verified == false ? undefined : "/settings/profile"} on:click={() => { $previous = window.location.pathname; }} disabled={window.location.pathname == "/settings/profile" || $verified == false} class="{window.location.pathname == "/settings/profile" || $verified == false ? "hover:cursor-not-allowed hover:bg-opacity-0 dark:hover:bg-opacity-0 opacity-50 dark:opacity-50" : "hover:cursor-pointer"} rounded-md b-menu w-full flex justify-around items-center">
                        <Icon icon=badge scale=1.75rem></Icon>
                    </MenuItem>
                </Tooltip>
            </div>
            {#if $verified}
                <Line class="my-2 mx-1"/>
                <MenuItem on:click={() => { $navmenu = false; }} href="/settings" class="rounded-md b-menu">
                    Team Settings
                </MenuItem>
            {/if}
        </MenuItems>
    </Menu>
{/if}

<style lang=postcss>
    hr {
        @apply my-2 border-zinc-200 dark:border-zinc-700;
    }
</style>