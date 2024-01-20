<script lang=ts>
    import Background from "$lib/Builders/Background.svelte";
    import DatePicker from "$lib/Builders/DatePicker.svelte";
    import Error from "$lib/Builders/Error.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    import Tooltip from "$lib/Builders/Tooltip.svelte";
    import RoleInput from "$lib/Components/RoleInput.svelte";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import { superForm } from "sveltekit-superforms/client";
    import dnt from 'date-and-time';
    import meridiem from "date-and-time/plugin/meridiem";
    import Page from "$lib/Builders/Page.svelte";

    export let data;

    dnt.plugin(meridiem);

    const { form, delayed, enhance, message, allErrors } = superForm(data.form, { dataType: 'json' });

    let localLoading = getContext('localLoading') as Writable<boolean>;

    $: $localLoading = $delayed;
</script>

<svelte:head>
    <title>Skywalkers | Create Team</title>
</svelte:head>

<Background>
    <Page>
        <form use:enhance method=POST>
            <h1 class="text-2xl mb-8">Create Team</h1>
            <div class="flex gap-1 items-center">
                <p class="text-lg">Owner:</p>
                <input bind:value={$form.uid} name=name class="w-full rounded-md p-1 px-1.5 bg-zinc-200 dark:bg-zinc-700"/>
            </div>
            <div class="flex gap-1 items-center mt-2">
                <p class="text-lg">ID:</p>
                <input bind:value={$form.id} name=name class="w-full rounded-md p-1 px-1.5 bg-zinc-200 dark:bg-zinc-700"/>
            </div>
            <div class="flex gap-1 items-center mt-2">
                <p class="text-lg">Role:</p>
                <input bind:value={$form.role} name=name class="w-full rounded-md p-1 px-1.5 bg-zinc-200 dark:bg-zinc-700"/>
            </div>
            <Error {allErrors} {message}></Error>
            <div class="h-6 w-full"></div>
            <button class="b-primary float-right">Create</button>
        </form>
    </Page>
</Background>

<style lang=postcss>
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
</style>