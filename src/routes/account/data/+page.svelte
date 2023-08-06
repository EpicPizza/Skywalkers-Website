<script lang=ts>
    import Background from "$lib/Builders/Background.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Page from "$lib/Builders/Page.svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import { getContext } from "svelte";
    import { onMount } from "svelte";
    import type { Unsubscriber } from "svelte/store";
    import { onDestroy } from "svelte";
    import type { User } from "firebase/auth";
    import Ellipse from "$lib/Builders/Ellipse.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    
    let client = getContext('client') as ReturnType<typeof firebaseClient>;

    let unsubscribe: Unsubscriber | undefined = undefined;

    let firebaseUser: User | null | false = false;
    let firebaseEntry: any | false = false;

    onMount(() => {
        unsubscribe = client.subscribe((user) => {
            if(user != undefined && 'preload' in user) return;

            firebaseUser = client.debug.getUser();
            firebaseEntry = client.debug.getEntry();
        })
    })

    onDestroy(() => {
        if(unsubscribe) unsubscribe();
    })

    let showmoreauth = false;
    let auth: HTMLElement;

    let showmorestore = false;
    let store: HTMLElement;
</script>

<Background>
    <Page expand size="36rem">
        <h1 class="text-2xl font-bold">Your Data:</h1>
        <Line class="my-4"></Line>
        <h2 class="text-lg mb-2">Firebase Auth (Authentication Service):</h2>
        <div bind:this={auth} class="rounded-lg relative bg-secondary-light dark:bg-secondary-dark w-full p-4 max-h-96 {showmoreauth ? "overflow-auto" : "overflow-hidden"}">
            {#if firebaseUser === false}
                <p>Loading <Ellipse/></p>
            {:else if !firebaseUser}
                <p class="font-bold text-red-500">Signed Out</p>
            {:else}
                <p class="whitespace-pre-line break-all">
                    {JSON.stringify(firebaseUser.toJSON(), null, "   ")}
                </p>
                {#if !showmoreauth}
                    <div class="absolute bottom-0 left-1/2 -translate-x-1/2 h-[58px] w-[140px] bg-secondary-light dark:bg-secondary-dark blur-sm"></div>
                {/if}
                <button class="{showmoreauth ? "block ml-auto mr-auto" : "absolute bottom-0 left-1/2 -translate-x-1/2 mb-2"} b-primary" on:click={() => { showmoreauth = !showmoreauth; auth.scrollTo(0, 0); }}>
                    {#if showmoreauth}
                        Show Less
                    {:else}
                        Show More
                    {/if}
                </button>
            {/if}
        </div>
        <p class="mt-4 leading-7">This is the data that gets stored in Firebase Auth (the authentication service used by this webiste). This data is only accesible by you and the server when needed.</p>
        <h2 class="text-lg mb-2 mt-8">Database Entry (Public):</h2>
        <div bind:this={store} class="rounded-lg relative bg-secondary-light dark:bg-secondary-dark w-full p-4 max-h-96 {showmorestore ? "overflow-auto" : "overflow-hidden"}">
            {#if $client == undefined}
                <p class="font-bold text-red-500">Signed Out</p>
            {:else if $client.team == undefined}
                <p class="font-bold text-red-500">You are not verified. Your data has not been stored on our database. Your email may be in our database, see explanation below.</p>
            {:else}
                <p class="whitespace-pre-line break-all">
                    {JSON.stringify(firebaseEntry, null, "   ")}
                </p>
                {#if !showmorestore}
                    <div class="absolute bottom-0 left-1/2 -translate-x-1/2 h-[58px] w-[140px] bg-secondary-light dark:bg-secondary-dark blur-sm"></div>
                {/if}
                <button class="{showmorestore ? "block ml-auto mr-auto" : "absolute bottom-0 left-1/2 -translate-x-1/2 mb-2"} b-primary" on:click={() => { showmorestore = !showmorestore; store.scrollTo(0, 0); }}>
                    {#if showmorestore}
                        Show Less
                    {:else}
                        Show More
                    {/if}
                </button>
            {/if}
        </div>
        <p class="mt-4 leading-7">This is the data a user would get when you are mentioned in a resource such as a meeting. Sensitive information like your email is never sent with this. It's not even in our own database. Your email may be stored in our database during the verification process if an admin has restricted a verification code to an email. It gets deleted after you are verified however.</p>
        <a href="/account" class="mt-4 b-primary flex items-center gap-1 w-fit"><Icon scale=1.25rem icon=arrow_back></Icon>Back</a>
    </Page>
</Background>