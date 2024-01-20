<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import Loading from "$lib/Builders/Loading.svelte";    
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import { slide } from "svelte/transition";
    import { superForm } from "sveltekit-superforms/client";
    import Error from '$lib/Builders/Error.svelte';
    import type { Warning } from "$lib/stores.js";
    import { getContext, onDestroy } from "svelte";
    import { goto, invalidateAll } from "$app/navigation";
    import type { Writable } from "svelte/store";

    let client = getContext('client') as ReturnType<typeof firebaseClient>;

    let localLoading = getContext('localLoading') as Writable<boolean>;
    let previous = getContext('previous') as Writable<string | undefined>;
    let warning = getContext('warning') as Writable<Warning | undefined>;

    export let data;

    const { form, tainted, reset, enhance, allErrors, message, delayed } = superForm(data.form, {
        delayMs: 500,
        timeoutMs: 8000,
        clearOnSubmit: 'errors-and-message',
    });

    $: $localLoading = $delayed;

    onDestroy(() => {
        $localLoading = false;
    })

    $: {
        if($message == 'Changes Saved') {
            warning.set({
                color: 'green',
                message: 'Profile Saved'
            });
            (async () => {
                if($previous != undefined) {
                    await goto($previous);
                    $previous = undefined;
                }
            })();
        }
    }
</script>

<svelte:head>
    <title>Edit Profile</title>
</svelte:head>

{#if $client == undefined}
    <Loading></Loading>
{:else}
    <form method=POST use:enhance>
        <h1 class="text-3xl font-light w-80">Your Profile:</h1>
        <div class="flex items-center mt-6">
            <label for="name" class="mr-2 text-lg">Name:</label>
            <input bind:value={$form.name} class="rounded-md p-1 w-full" id="name" name="name"/>
        </div>  
        <div class="flex items-center mt-2">
            <label for="pronouns" class="mr-2 text-lg">Pronouns:</label>
            <input bind:value={$form.pronouns} class="rounded-md p-1 w-full" id="pronouns" name="pronouns"/>
        </div>
        <Error disallowMessage="Changes Saved" allErrors={allErrors} message={message}></Error>
        <div transition:slide|local class="flex items-center justify-between mt-6">
            {#if $tainted}
                <div class="flex gap-2">
                    <button class="b-default" on:click={(e) => { 
                        e.preventDefault();
                        reset();
                    }}>Reset</button>
                </div>
            {:else}
                <div></div>
            {/if}
            <button class="b-primary flex items-center gap-1">
                <Icon scale=1.25rem icon=save></Icon>
                <p>Save</p>
            </button>
        </div>
    </form>  
{/if}