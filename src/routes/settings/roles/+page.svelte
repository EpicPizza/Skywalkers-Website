<script lang=ts>
    import { page } from "$app/stores";
    import type { Role as RoleType } from "$lib/Roles/role";
    import Role from '$lib/Roles/Role.svelte'
    import { getContext } from "svelte";
    import { get, type Writable } from "svelte/store";

    let roles = get(getContext('roles') as Writable<RoleType[]>);
    let role: RoleType;
    export let data;

    for(let i = 0; i < roles.length; i++) {
        if(roles[i].name == "everyone") {
            role = roles[i]
        }
    }
</script>

<svelte:head>
    <title>Skywalkers | Roles</title>
</svelte:head>

<Role discord={data.discord.roles} role={role}></Role>