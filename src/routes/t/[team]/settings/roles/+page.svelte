<script lang=ts>
    import { page } from "$app/stores";
    import type { Role as RoleType } from "$lib/Roles/role";
    import Role from '$lib/Roles/Role.svelte'
    import type { createCurrentTeam } from "$lib/stores.js";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";

    export let data;

    let roles = data.roles;
    let role: RoleType;

    for(let i = 0; i < roles.length; i++) {
        if(roles[i].name == "everyone") {
            role = roles[i]
        }
    }

    let teamInfo = getContext('teamInfo') as Writable<Map<string, { name: string, website: string, icon: string }>>
    let currentTeam = getContext('currentTeam') as ReturnType<typeof createCurrentTeam>;

    $: info = $teamInfo.get($page.params.team == undefined ? ($currentTeam ? $currentTeam.team : "000000") : $page.params.team);
</script>

<svelte:head>
    <title>{info?.name ?? "Skywalkers"} | Roles</title>
</svelte:head>

<Role discord={data.discord.roles} role={role}></Role>