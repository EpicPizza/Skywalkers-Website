<script lang=ts>
    import Link from "$lib/Builders/Link.svelte";
    import Loading from "$lib/Builders/Loading.svelte";
    import SignIn from "$lib/Firebase/SignIn.svelte";
    import { enhance } from '$app/forms';
    import { goto, invalidateAll } from "$app/navigation";
    import { getContext } from "svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase.js";
    import Footer from "$lib/Nav/Footer.svelte";

    let client = getContext('client') as ReturnType<typeof firebaseClient>;

    export let data;
</script>

{#if $client == undefined}
    <h1 class="text-3xl text-center font-light">Skywalkers Team Website</h1>
    <p class="mt-4 text-center">Sign in first to continue the verification process needed to verify that you are a member of <Link href="https://www.frcskywalkers.org/">FRC skywalkers.</Link></p>
    <SignIn></SignIn>   
{:else if $client.team == undefined}
    <form method=POST use:enhance>
        <h1 class="text-3xl text-center font-light">Skywalkers Team Website</h1>
        <p class="mt-4 text-center">Join to finish verification as <span class="font-bold underline">{$client.email}</span>. If you want to use a different email than the one we used to email you this link, contact website manager for help.</p>
        <button class="w-full h-12 border-zinc-200 border-[1px] rounded-full mt-4 flex flex-row items-center justify-around bg-green-500 dark:border-zinc-700">
            <span class="text-white tracking-wide font-bold text-xl">Join</span>
        </button>
    </form>
{:else}
    <Loading></Loading>
{/if}