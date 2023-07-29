<script lang=ts>
    import Delete from './Delete.svelte';
    import { page } from "$app/stores";
    import Icon from "$lib/Builders/Icon.svelte";
    import { collection, deleteDoc, doc, query, where } from "firebase/firestore";
    import { fade } from "svelte/transition";
    import type { Role } from "./role";
    import { goto } from "$app/navigation";
    import { createEventDispatcher, getContext } from 'svelte';
    import type { firebaseClient } from '$lib/Firebase/firebase';

    let client = getContext('client') as ReturnType<typeof firebaseClient>;

    export let role: Role;

    const dispatch = createEventDispatcher();
</script>

<div>
    <button on:click={() => { dispatch("click", true); goto("/settings/roles/" + role.id); }} class="flex mb-0.5 group rounded-md transition p-1 items-center text-left bg-black dark:bg-white {$page.params.slug == role.id || ($page.params.slug == undefined && role.name == 'everyone') ? "bg-opacity-[.15] dark:bg-opacity-[.15]" : "bg-opacity-0 dark:bg-opacity-0" } hover:bg-opacity-10 dark:hover:bg-opacity-10 w-full overflow-hidden">
        <div style="background-color: {role.color};" class="mr-2 ml-1 w-4 min-w-[1rem] h-4 rounded-full"></div>
        <h1 class="whitespace-nowrap flex-grow overflow-hidden overflow-ellipsis">{role.name}</h1>
        {#if role.name != "everyone"}
            <Delete bind:role={role}></Delete>
        {/if}
    </button>
</div>