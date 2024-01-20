<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import Loading from "$lib/Builders/Loading.svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import { createEventDispatcher, getContext, onDestroy, onMount } from "svelte";
    import ImmediateDispatchDelete from "./ImmediateDispatchDelete.svelte";
    import type { Role } from "$lib/Roles/role";
    import { string } from "zod";
    import type { createCurrentTeam, createPermissions } from "$lib/stores";
    import type { Writable } from "svelte/store";

    const dispatch = createEventDispatcher();

    let id: string;

    export {id as role};

    const client = getContext('client') as ReturnType<typeof firebaseClient>;
    const permissions = getContext('permissions') as ReturnType<typeof createPermissions>;
    const team = getContext('team') as Writable<string>;
    const currentTeam = getContext('currentTeam') as ReturnType<typeof createCurrentTeam>;

    let role = client.getRole(id, $team);

    let awaitedRole: Role | undefined;

    let invalid = false;

    let invalidObject: { id: string, invalid: boolean } = { id: "", invalid: false } ;

    $: invalid = (awaitedRole != undefined && $currentTeam && $currentTeam.level != undefined && awaitedRole.level >= $currentTeam.level) || ($permissions.includes("MANAGE_ROLES"));

    $: invalidObject.invalid = invalid;

    export { invalidObject as invalid };

    onMount(async () => {
        awaitedRole = await role;
        invalidObject.id = awaitedRole?.id as string;
    })

    onDestroy(() => {
        invalid = false;
    })
</script>

{#await role then role} 
    {#if role != undefined && role.name != 'everyone'}
        <div class="inline-flex {invalid ? "bg-red-500 bg-opacity-20 dark:bg-opacity-10 dark:text-red-500 text-red-900" : "bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10"} p-2 px-3 rounded-lg w-fit items-center gap-2 mb-2 mr-2">
            <div style="background-color: {role.color};" class="w-4 h-4 rounded-full"></div>
            {role.name}
            <button on:click|preventDefault={() => { dispatch("delete"); }} class="w-6 h-6 transition bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10 hover:bg-opacity-20 hover:dark:bg-opacity-20 flex rounded-full justify-around items-center"><Icon scale=1.1rem icon=close></Icon></button>
        </div>
    {:else}
        <ImmediateDispatchDelete on:delete={() => { dispatch("delete"); }}/>
    {/if}
{/await}
