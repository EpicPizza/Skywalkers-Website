<script lang="ts">
    import ThemeSwitcher from "$lib/Nav/ThemeSwitcher.svelte";
    import Logo from "$lib/Nav/Logo.svelte";
    import Profile from "./Profile.svelte";
</script>

<Logo/>
<div class="flex flex-row ml-2 grow-[1] text-lg font-normal overflow-scroll">
    <a class="page" href="/">Home</a>
    <a class="page" href="/resources">Resources</a>
    <a class="page" href="/tasks">Tasks</a>
    <a class="page" href="/meetings">Meetings</a>
    <a class="page" href="/reports">Reports</a>
</div>
<div class="mr-2">
    <ThemeSwitcher/>
</div>
<Profile/>

<style lang="postcss">
    .page {
        @apply transition p-2 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-5 dark:hover:bg-opacity-5 rounded-md;
    }
</style>