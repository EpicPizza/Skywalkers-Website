<script lang="ts">
    import ThemeSwitcher from "$lib/Nav/ThemeSwitcher.svelte";
    import Logo from "$lib/Nav/Logo.svelte";
    import Profile from "./Profile.svelte";
    import { createVerified, navLinks } from "$lib/stores";
    import { getContext } from "svelte";
    import { navigating, page } from "$app/stores";
    import { browser } from "$app/environment";

    let verified = getContext('verified') as ReturnType<typeof createVerified>;
</script>

<Logo/>
{#key $navigating}
    <div class="flex flex-row ml-2 grow-[1] text-lg font-normal overflow-auto">
        {#each $navLinks as link}
            {#if link.protected && $verified === false}
                <!-- svelte-ignore a11y-missing-attribute -->
                <a class="cursor-not-allowed p-2 opacity-50">{link.display}</a>
            {:else} 
                <a href={link.href} class="transition p-2 mx-1 rounded-md {($page.url.pathname == link.href || (link.href != "/" && $page.url.pathname.includes(link.href))) ? "bg-accent-500 text-black" : "bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-5 dark:hover:bg-opacity-5"}">{link.display}</a>
            {/if}
            <hr>
        {/each}
    </div>
{/key}
<div class="mr-2">
    <ThemeSwitcher/>
</div>
<Profile/>
