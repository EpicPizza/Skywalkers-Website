<script lang=ts>
    import Loading from "$lib/Builders/Loading.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    import { onDestroy, getContext } from "svelte";
    import { redirect } from "@sveltejs/kit";
    import { goto } from "$app/navigation";
    import type { firebaseClient } from "$lib/Firebase/firebase.js";
    import type { Writable } from "svelte/store";

    let client = getContext('client') as ReturnType<typeof firebaseClient>;

    let localLoading = getContext('localLoading') as Writable<boolean>;
    let loading = getContext('loading') as Writable<boolean>;

    let restart: HTMLButtonElement;

    export let data;

    onDestroy(() => {
        $localLoading = false;
    })
</script>

{#if $loading || $client == undefined}
    <Loading></Loading>
{:else}
    <h1 class="text-3xl font-light">Finish Verification:</h1>
    <p class="mt-2 break-words inline-block" style="word-break: break-word;">I confirm that I want to use <span class="underline font-bold">{$client.email}</span> for my skywalkers account. If not, I will click restart to resign in and start the verfication process again. If I change my email in the future, my account will have to be manually moved.</p>
    <p class="mt-2">Code Entered: <span class="font-bold">{data.verify?.code.replaceAll("-", " - ")}</span></p>
    <div class="flex justify-between mt-4 items-center">
        <div class="flex items-center">
            <a class="inline-block leading-6" href="/verify"><button class="b-default h-[2.125rem] flex flex-row items-center sm:gap-[0.125rem] after:content-[''] sm:after:content-['Back']"><Icon icon=arrow_back scale="1.3rem"></Icon></button></a>
            <button bind:this={restart} class="b-default mr-2 ml-2" on:click={async () => { $loading = true; await goto("/verify?flow=true"); client.signIn(); }}>Restart</button>
        </div>
        <a data-sveltekit-preload-data=off href=/verify/finish><button on:click={() => { setTimeout(() => { $localLoading = true }, 500)}} class="b-blue flex flex-row items-center sm:gap-[0.125rem] before:content-[''] h-[2.125rem] sm:before:content-['Finish']"><Icon icon=arrow_forward scale="1.3rem"></Icon></button></a>
    </div>
{/if}