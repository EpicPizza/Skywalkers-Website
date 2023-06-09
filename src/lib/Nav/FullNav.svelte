<script lang="ts">
    import ThemeSwitcher from "$lib/Nav/ThemeSwitcher.svelte";
    import Logo from "$lib/Nav/Logo.svelte";
    import Profile from "./Profile.svelte";
</script>

<Logo/>
<div class="flex flex-row ml-2 grow-[1] text-lg font-normal overflow-scroll">
    <a href="/">Home</a>
    <a href="/resources">Resources</a>
    <a href="/tasks">Tasks</a>
    <a href="/meetings">Meetings</a>
    <a href="/reports">Reports</a>
</div>
<div class="mr-2">
    <ThemeSwitcher/>
</div>
<Profile/>

<style lang="postcss">
    a {
        @apply transition p-2 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-5 dark:hover:bg-opacity-5 rounded-md;
    }
</style>