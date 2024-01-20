<script lang="ts">
    import ThemeSwitcher from "$lib/Nav/ThemeSwitcher.svelte";
    import Logo from "$lib/Nav/Logo.svelte";
    import Profile from "./Profile.svelte";
    import { createCurrentTeam, createVerified, navLinks } from "$lib/stores";
    import { getContext } from "svelte";
    import { navigating, page } from "$app/stores";
    import { browser } from "$app/environment";
    import type { Writable } from "svelte/store";
    

    let verified = getContext('verified') as ReturnType<typeof createVerified>;
    let team = getContext('team') as Writable<string>;
    let currentTeam = getContext('currentTeam') as ReturnType<typeof createCurrentTeam>;
    let teamInfo = getContext('teamInfo') as Writable<any>;
    let global = getContext('global') as Writable<boolean>;
</script>

<Logo/>
{#key $navigating}
    <div class="flex flex-row ml-2 grow-[1] text-lg font-normal overflow-auto">
        {#key $page}
            {#each $navLinks as link}
                {#if (link.protected && $verified === false) || (link.specific && $global)}
                    <!-- svelte-ignore a11y-missing-attribute -->
                    <a class="cursor-not-allowed p-2 mx-1 opacity-50">{link.display}</a>
                {:else if link.href == "/"}
                    <a href="{!$global && ($page.params.team || $currentTeam)  ? "/t/" + ($page.params.team == undefined ? ($currentTeam ? $currentTeam.team : "000000") : $page.params.team) : ""}{link.href}" class="transition p-2 mx-1 rounded-md {($page.url.pathname == "/" || $page.url.pathname == "/t/" + $page.data.unverifiedTeam) ? "bg-accent-500 text-black" : "bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-5 dark:hover:bg-opacity-5"}">{link.display}</a>
                {:else} 
                    <a href="{link.specific ? "/t/" + $team : ""}{link.href}" class="transition p-2 mx-1 rounded-md {($page.url.pathname == (link.specific ? "/t/" + $team + link.href : link.href) || (link.href != "/" && $page.url.pathname.includes(link.specific ? "/t/" + $team + link.href : link.href))) ? "bg-accent-500 text-black" : "bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-5 dark:hover:bg-opacity-5"}">{link.display}</a>
                {/if}
                <hr>
            {/each}
        {/key}
    </div>
{/key}
<div class="mr-2">
    <ThemeSwitcher/>
</div>
<Profile/>
