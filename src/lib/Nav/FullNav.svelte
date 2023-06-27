<script lang="ts">
    import ThemeSwitcher from "$lib/Nav/ThemeSwitcher.svelte";
    import Logo from "$lib/Nav/Logo.svelte";
    import Profile from "./Profile.svelte";
    import { navLinks, verified } from "$lib/stores";
</script>

<Logo/>
<div class="flex flex-row ml-2 grow-[1] text-lg font-normal overflow-auto">
    {#each $navLinks as link}
        {#if link.protected && $verified === false}
            <!-- svelte-ignore a11y-missing-attribute -->
            <a class="cursor-not-allowed p-2 opacity-50">{link.display}</a>
        {:else} 
            <a href={link.href} class="transition p-2 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-5 dark:hover:bg-opacity-5 rounded-md">{link.display}</a>
        {/if}
        <hr>
    {/each}
</div>
<div class="mr-2">
    <ThemeSwitcher/>
</div>
<Profile/>
