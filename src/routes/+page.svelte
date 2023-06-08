<script lang=ts>
    import Background from "$lib/Builders/Background.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Link from "$lib/Builders/Link.svelte";
    import Loading from "$lib/Builders/Loading.svelte";
    import Page from "$lib/Builders/Page.svelte";
    import SignIn from "$lib/Firebase/SignIn.svelte";
    import { client } from "$lib/Firebase/firebase";
    import { loading, mode, warning } from "$lib/stores";

    export let data;

    if(data.errors.signedout) {
        warning.set({
            color: 'red',
            message: 'Sign in to access'
        })
    } else if(data.errors.verified) {
        warning.set({
            color: 'aqua',
            message: 'Already verified',
        })
    }
</script>

<svelte:head>
    <title>Skywalkers | Home</title>
</svelte:head>

<Background>
    <Page>
        {#if $client == undefined}
            <h1 class="text-3xl text-center font-light">Skywalkers Team Website</h1>
            <p class="mt-4 text-center">This is only for team members to access team resources. Our public website can be found at <Link href="https://www.frcskywalkers.org/">frcskywalkers.org</Link>.</p>
            <SignIn></SignIn>   
        {:else if $client != undefined || 'preload' in $client}
            {#if data.team} <!--At first this seems like a secruity risk, but in finished implementation this would be loaded off of load data, which would be blank for a nonteam user.-->
                <h1 class="text-3xl text-center font-light">Skywalkers Team Website</h1>
                <a href="/meetings" class="w-full h-16 inline-block mt-6 text-xl">
                    <button class="b-bold w-full h-full">
                        Go to Meetings
                    </button>
                </a>
            {:else}
                <Loading></Loading>
            {/if}
        {/if}
    </Page>
</Background>