<script lang=ts>
    import Background from "$lib/Builders/Background.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Page from "$lib/Builders/Page.svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import { getContext, onDestroy } from "svelte";
    import { superForm } from "sveltekit-superforms/client";
    import Role from "../../../../../lib/Members/Role.svelte";
    import Dialog from "$lib/Builders/Dialog.svelte";
    import { goto } from "$app/navigation";
    import Error from "$lib/Builders/Error.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    import { fade, slide } from "svelte/transition";
    import type { Writable } from "svelte/store";
    import { string } from "zod";

    export let data;

    let client = getContext('client') as ReturnType<typeof firebaseClient>;

    let { form, reset, tainted, delayed, enhance, message, allErrors } = superForm(data.form, {
        dataType: 'json',
    });

    let localLoading = getContext('localLoading') as Writable<boolean>;

    $: $localLoading = $delayed;

    function deleteRole(id: string) {
        let newRoles = structuredClone($form.roles);
        newRoles.splice(newRoles.indexOf(id), 1);
        reset({ data: { roles: structuredClone(newRoles) }});
    }

    let open = false;

    let selected: typeof data.roles[0] | undefined;

    function addRole(id: string) {
        let newRoles = structuredClone($form.roles);
        newRoles.push(id);
        reset({ data: { roles: structuredClone(newRoles) }});
    }

    let areInvalid = new Array<{ id: string, invalid: boolean }>();

    let invalid = false;
    let invalidPermission = false;

    $: {
        invalid = false;

        for(let i = 0; i < $form.roles.length; i++) {
            for(let j = 0; j < areInvalid.length; j++) {
                if($form.roles[i] == areInvalid[j].id && areInvalid[j].invalid) {
                    invalid = true;
                }
            }
        }

        let current = $client;

        if(current != undefined && current.permissions != undefined && !current.permissions.includes('MANAGE_ROLES')) {
            invalidPermission = true;
        } else {
            invalidPermission = false;
        }
    }
</script>

<svelte:head>
    <title>Skywalkers | Unkick Member</title>
</svelte:head>

<Background>
    <Page expand size="24rem">
        <h1 class="text-2xl font-bold">Unkick {$form.name}</h1>
        <Line class="my-4"></Line>

        <form use:enhance method=POST>
            <div class="flex gap-1 items-center w-full">
                <p class="text-lg">Name:</p>
                <input name=name bind:value={$form.name} class="rounded-md w-full p-1"/>
            </div>
    
            <div class="flex gap-1 mt-3 items-center w-full">
                <p class="text-lg">Pronouns:</p>
                <input name=pronouns bind:value={$form.pronouns} class="rounded-md w-full p-1"/>
            </div>
    
            <input hidden name=id bind:value={$form.id}/>
    
            <div class="flex items-center mt-3">
                <p class="text-lg">Main Role:</p>
                <select bind:value={$form.role} class="p-1 w-32 ml-2 rounded-md" name=role>
                    <option value="student">student</option>
                    <option value="parent">parent</option>
                    <option value="mentor">mentor</option>
                </select>
            </div>
    
            <p class="text-lg mb-2 mt-3 ">Roles:</p>
    
            <div class="border-border-light dark:border-border-dark rounded-xl border-[1px] p-4 w-full">
                {#each $form.roles as role, i (role)}
                    <Role bind:invalid={areInvalid[i]} on:delete={() => { deleteRole(role); }} {role}></Role>
                {:else}
                    <p class="opacity-75 mb-2">
                        {$form.name} has no roles.
                    </p>
                {/each}
                {#if !invalidPermission && $form.roles.length != data.roles.length - 1}
                    <button on:click|preventDefault={() => { open = !open; }} class="b-default mt-5 block">Add Role</button>
                {:else}
                    <div class="-mt-2"></div>
                {/if}
            </div>

            {#if invalid}
                <div out:slide class="bg-red-500 bg-opacity-20 dark:bg-opacity-10 dark:text-red-500 text-red-900 flex rounded-lg p-4 mt-3 gap-3">
                    <Icon scale=2rem icon=error></Icon>
                    <p>
                        {#if !invalidPermission}
                            A role with a higher permission level than your current permission level was found.
                        {:else}
                            Since you can't manage roles, you need to remove all roles before unkicking.
                        {/if}
                    </p>
                </div>
            {/if}

            <Error {message} {allErrors}></Error>
    
            <div class="flex flex-row-reverse w-full mt-8 gap-2">
                <button disabled={invalid} class="b-primary disabled:opacity-75 disabled:cursor-not-allowed">Unkick</button>
                <button class="b-secondary" on:click|preventDefault={() => { $tainted = {}; if(data.params.redirectToMain) { goto("/settings/members"); } else { goto("/settings/members/" + data.user.id); }}}>Cancel</button>
            </div>
        </form>
    </Page>
</Background>

<Dialog isOpen={open} width=24rem>
    <svelte:fragment slot=title>
        <h1 class="text-2xl">Choose a Role</h1>
        <Line class="mt-4"></Line>
    </svelte:fragment>

    <div slot=content class="py-2 h-[calc(100dvh-17rem)] overflow-auto overflow-y-visible">
        {#each data.roles as role}
            {#if role.name != 'everyone' && !$form.roles.includes(role.id) && $client?.level != undefined && role.level < $client?.level}
                <button on:click={() => { selected = role; }} class="flex w-full items-center transition rounded-md p-2 mb-1 bg-black dark:bg-white {selected != undefined && selected.id == role.id ? "bg-opacity-10 dark:bg-opacity-10" : "bg-opacity-0 dark:bg-opacity-0"}">
                    <div style="background-color: {role.color};" class="w-6 h-6 mr-2 rounded-full"></div>
                    <p>{role.name}</p>
                </button>
            {/if}
        {/each}
    </div>

    <Line class="mb-4"></Line>

    <div class="flex justify-between">
        <div>
            {#if selected != undefined}
                <div class="flex w-auto items-center transition rounded-md px-3 py-[7px] bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10">
                    <div style="background-color: {selected.color};" class="w-4 h-4 mr-2 rounded-full"></div>
                    <p class="text-sm">{selected.name}</p>
                </div>
            {/if}
        </div>
        <div>
            <button class="b-default mr-1" on:click|preventDefault={() => { open = !open; selected = undefined; }}>Cancel</button>
            <button on:click={() => { if(selected != undefined) { addRole(selected.id); open = !open; selected = undefined; } }} disabled={selected == undefined} class="b-green disabled:opacity-50 disabled:cursor-not-allowed">Add</button>
        </div>
    </div>
</Dialog>