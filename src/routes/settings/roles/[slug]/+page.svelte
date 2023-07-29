<script lang=ts>
    import { page } from "$app/stores";
    import type { Role as RoleType } from "$lib/Roles/role";
    import Role from '$lib/Roles/Role.svelte'
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";

    export let data;
    let role: RoleType;
    let found = false;
    let roles = getContext('roles') as Writable<RoleType[]>;

    $: { 
        found = false;
        let currentRoles = $roles;
        for(let i = 0; i < currentRoles.length; i++) {
            if(currentRoles[i].id == data.role) {
                role = currentRoles[i];
                found = true;
            }
        }
    }
</script>

<svelte:head>
    <title>Skywalkers | Roles</title>
</svelte:head>

{#if !found}
    <h1 class="p-8 text-2xl font-bold text-red-500 dark:text-red-500 text-center">
        Role Not Found
    </h1>
{:else}
    <Role discord={data.discord.roles} role={role}></Role>
{/if}