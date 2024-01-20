<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import { deleteDoc, doc } from "firebase/firestore";
    import { fade } from "svelte/transition";
    import { deleteRole, type Role } from "./role";
    import Dialog from "$lib/Builders/Dialog.svelte";
    import DeleteDialog from "./DeleteDialog.svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { getContext } from "svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import type { Writable } from "svelte/store";
    import type { createCurrentTeam, createPermissions } from "$lib/stores";

    let client = getContext('client') as ReturnType<typeof firebaseClient>;
    const permissions = getContext('permissions') as ReturnType<typeof createPermissions>;
    const currentTeam = getContext('currentTeam') as ReturnType<typeof createCurrentTeam>;
    const team = getContext('team') as Writable<string>;

    let sidebar = getContext('sidebar') as Writable<boolean>;
    let clicked = getContext('clicked') as Writable<boolean>;

    export let role: Role;
    let open: boolean = false;

    let loading = false;

    async function handleDelete() {
        if(loading) return;

        loading = true;

        await deleteRole(role.id, $team);

        if($page.params.slug == role.id) {
            goto("/t/" + $team + "/settings/roles");

            $sidebar = true;
        }

        handleClick();

        loading = false;
    }

    function handleClick() {
        open = !open;
    }
</script>

<button class="hidden {!$permissions.includes('MANAGE_ROLES') || $currentTeam == undefined || $currentTeam.level == undefined || $currentTeam.level <= role.level ? "" : "group-hover:block"}" on:click|stopPropagation={handleClick} transition:fade="{{ duration: 100 }}">
    <Icon icon=delete scale="1.15rem"></Icon>
</button>

<DeleteDialog bind:open {role} on:delete={handleDelete}></DeleteDialog>

