<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import { getContext, onDestroy } from "svelte";
    import { onMount } from "svelte";
    import Profile from "./Profile.svelte";
    import { Menu } from "@rgossiaux/svelte-headlessui";
    import type { Writable } from "svelte/store";
    import { page } from "$app/stores"
    import type { createCurrentTeam } from "$lib/stores";

    let navmenu = getContext('navmenu') as Writable<boolean>;
    let teamInfo = getContext('teamInfo') as Writable<Map<string, { name: string, website: string, icon: string }>>
    let team = getContext('team') as Writable<string>;
    let global = getContext('global') as Writable<boolean>;
    let currentTeam = getContext('currentTeam') as ReturnType<typeof createCurrentTeam>;

    $: info = $teamInfo.get($page.params.team == undefined ? ($currentTeam ? $currentTeam.team : "000000") : $page.params.team);

    onDestroy(() => {
        $navmenu = false;
    })

    let main: HTMLAnchorElement;

    onMount(() => {
        main.addEventListener("click", () => {
            $navmenu = false;
        })
    })
</script>

<div class="h-full w-full relative z-10">
    <div class="absolute flex flex-col justify-around h-full">
        <button class="w-10 h-10 b-default flex items-center justify-around" on:click={() => {navmenu.update((n) => { return !n })}}>
            <Icon icon="menu" scale="1.75rem"/>
        </button>
    </div>
    
    <div class="flex flex-row justify-around w-full">
        {#if info}
            <a bind:this={main} href="{!$global && ($page.params.team || $currentTeam)  ? "/t/" + ($page.params.team == undefined ? ($currentTeam ? $currentTeam.team : "000000") : $page.params.team) : ""}/" class="flex justify-around absolute h-full flex-col">
                <img alt="logo" src="{$global ? "/favicon.webp" : info.icon}" class="max-h-[3rem] max-w-[3rem] rounded-lg">
            </a>
        {:else}
            <a bind:this={main} href="{!$global && ($page.params.team || $currentTeam)  ? "/t/" + ($page.params.team == undefined ? ($currentTeam ? $currentTeam.team : "000000") : $page.params.team) : ""}/" class="flex justify-around absolute h-full flex-col">
                <img alt="logo" src="/favicon.webp" class="max-h-[3rem] max-w-[3rem] rounded-lg">
            </a>
        {/if}
    </div>
    
    <div  class="min-w-[5rem] flex float-right h-full flex-col justify-around">
        <div class="flex flex-row-reverse">
            <Profile/>
        </div>
    </div>
</div>