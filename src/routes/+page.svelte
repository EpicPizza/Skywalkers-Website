<script lang=ts>
    import { invalidateAll } from "$app/navigation";
    import Background from "$lib/Builders/Background.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Link from "$lib/Builders/Link.svelte";
    import Loading from "$lib/Builders/Loading.svelte";
    import Page from "$lib/Builders/Page.svelte";
    import Tooltip from "$lib/Builders/Tooltip.svelte";
    import SignIn from "$lib/Firebase/SignIn.svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase.js";
    import Footer from "$lib/Nav/Footer.svelte";
    import type { Warning, createMode, createVerified } from "$lib/stores";
    import { getContext, onMount } from "svelte";
    import type { Writable } from "svelte/store";

    let mode = getContext('mode') as ReturnType<typeof createMode>;
    let client = getContext('client') as ReturnType<typeof firebaseClient>;
    let verified = getContext('verified') as ReturnType<typeof createVerified>;

    let warning = getContext('warning') as Writable<Warning | undefined>;

    export let data;

    if(data.errors.signedout) {
        warning.set({
            color: 'red',
            message: 'Sign in to access'
        })
    } else if(data.errors.verified) {
        warning.set({
            color: 'aqua',
            message: 'Verified',
        })
    }

    onMount(() => {
        window.history.pushState(null, "", "/");
    })
</script>

<svelte:head>
    <title>Skywalkers | Home</title>
</svelte:head>

<Background>
    <Page size="28rem">
        {#if $client == undefined}
            <h1 class="text-3xl text-center font-light">Skywalkers Team Website</h1>
            <p class="mt-4 text-center">This is only for team members to access team resources. Our public website can be found at <Link href="https://www.frcskywalkers.org/">frcskywalkers.org</Link>.</p>
            <SignIn></SignIn>   
        {:else if $client != undefined || 'preload' in $client}
            {#if $verified} <!--At first this seems like a secruity risk, but in finished implementation this would be loaded off of load data, which would be blank for a nonteam user.-->
                <h1 class="text-3xl text-center font-light mb-6">Skywalkers Team Website</h1>
                <a href="/meetings" class="w-full h-16 inline-block text-xl">
                    <button class="b-accent w-full h-full">
                        Go to Meetings
                    </button>
                </a>
            {:else}
                <Loading></Loading>
            {/if}
        {/if}
    </Page>
</Background>
<Footer></Footer>