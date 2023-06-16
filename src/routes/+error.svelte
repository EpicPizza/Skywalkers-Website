<script lang=ts>
    import Background from "$lib/Builders/Background.svelte";
    import Page from "$lib/Builders/Page.svelte";
    import SignIn from "$lib/Firebase/SignIn.svelte";
    import { page } from '$app/stores';
    import Link from "$lib/Builders/Link.svelte";
    import Footer from "$lib/Footer/Footer.svelte";
</script>

<Background>
    <Page>
        <h1 class="text-3xl text-center text-red-500 dark:text-red-500 font-bold">{$page.error?.message}</h1>
        {#if $page.error?.message == "Sign In Required"}
            <div class="mt-2">
                <p class="text-center mt-4">This is only for team members to access team resources. Our public website can be found at <Link href="https://www.frcskywalkers.org/">frcskwalkers.org</Link>.</p>
                <SignIn></SignIn>
            </div>
        {/if}
    </Page>
</Background>
<Footer></Footer>