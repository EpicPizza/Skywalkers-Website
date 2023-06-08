<script lang=ts>
    import Background from "$lib/Builders/Background.svelte";
    import Page from "$lib/Builders/Page.svelte";
    import SignIn from "$lib/Firebase/SignIn.svelte";
    import { page } from '$app/stores';
</script>

<Background>
    <Page>
        <h1 class="text-3xl text-center font-light">{$page.error?.message}</h1>
        {#if $page.error?.message == "Sign In Required"}
            <div class="mt-2">
                <SignIn></SignIn>
            </div>
        {/if}
    </Page>
</Background>