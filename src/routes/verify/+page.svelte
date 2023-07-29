<script lang=ts> 
    import Loading from "$lib/Builders/Loading.svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import Icon from "$lib/Builders/Icon.svelte";
    import { getContext, onDestroy, onMount } from "svelte";
    import { superForm } from "sveltekit-superforms/client"
    import { goto } from "$app/navigation";
    import type { Writable } from "svelte/store";
    import type { Warning } from "$lib/stores.js";

    let client = getContext('client') as ReturnType<typeof firebaseClient>;

    let warning = getContext('warning') as Writable<Warning | undefined>;
    let localLoading = getContext('localLoading') as Writable<boolean>;
    let loading = getContext('loading') as Writable<boolean>;

    export let data;

    const { form, allErrors, enhance, delayed, message } = superForm(data.verify.forms.one, {
        delayMs: 500,
        timeoutMs: 8000,
        clearOnSubmit: 'errors-and-message',
        taintedMessage: null,
    });

    $: $localLoading = $delayed;

    if(data.verify.errors.invalid) {
        warning.set({
            color: 'red',
            message: 'An unexpected error occurred'
        })
    }

    if(data.verify.errors.redirected) {
        warning.set({
            color: 'yellow',
            message: 'Verify to access'
        })
    }


    onDestroy(() => {
        $localLoading = false;
    })

    onMount(() => {
        $loading = false;
 
        if(data.verify.errors.invalid) {
            $localLoading = false;
        }
    });
</script>

{#if $client == undefined}
    <Loading></Loading>
{:else}
    <h1 class="text-3xl font-light">Verification:</h1>
    <p class="text-md mt-6">To access the team website, you need to verify that you are part of our team. Enter the codes sent to your email here:</p>
    <form method="POST" use:enhance>
        <div class="flex-row flex gap-4 mt-4">
            <div class="w-full">
                <p class="text-sm -mt-5 translate-x-2 translate-y-4 w-min whitespace-nowrap bg-white dark:bg-zinc-800 px-1 leading-4">Personal<span class="after:content-[''] sm:after:content-['_Code']"></span>:</p>
                <input autocomplete="off" bind:value={$form.member_id} placeholder=000000 name="member_id" class="p-2 mt-2 w-full bg-white border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 border-[1px] rounded-md pl-3" type="string">
            </div>
            <div class="w-full">
                <p class="text-sm -mt-5  translate-x-2 translate-y-4 w-min whitespace-nowrap bg-white dark:bg-zinc-800 px-1 leading-4">Team<span class="after:content-[''] sm:after:content-['_Code']"></span>:</p>
                <input autocomplete="off" bind:value={$form.team_id} placeholder=000000 name="team_id" class="p-2 mt-2 w-full bg-white border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 border-[1px] rounded-md pl-3" type="string">
            </div>
        </div>
        {#if $allErrors.length || $message}
            <div class="w-full h-3"></div>
        {/if}
        {#if $allErrors.length}
            <ul>
            {#each $allErrors as error}
                <li>
                    {#if Array.isArray(error.messages)}
                        {#each error.messages as code_error}
                            <p class="text-red-500 dark:text-red-500 font-bold">{code_error}</p>
                        {/each}
                    {:else}
                        <p class="text-red-500 dark:text-red-500 font-bold">{error.messages}</p>
                    {/if}
                </li>
            {/each}
            </ul>
        {/if}
        {#if $message}
            <p class="text-red-500 dark:text-red-500 font-bold">{$message}</p>
        {/if}
        <div class="flex justify-between mt-8 items-center">
            <button class="b-default" on:click={async (event) => { event.preventDefault(); await goto("/?flow=true"); client.signOut(); }}>Sign out</button>
            <button class="b-blue flex flex-row items-center sm:gap-[0.125rem] h-[2.125rem] before:content-[''] sm:before:content-['Next']"><Icon icon=arrow_forward scale="1.3rem"></Icon></button>
        </div>
    </form>
{/if}