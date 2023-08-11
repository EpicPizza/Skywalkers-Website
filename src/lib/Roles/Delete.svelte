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

    let client = getContext('client') as ReturnType<typeof firebaseClient>;

    let sidebar = getContext('sidebar') as Writable<boolean>;
    let clicked = getContext('clicked') as Writable<boolean>;

    export let role: Role;
    let open: boolean = false;

    let loading = false;

    async function handleDelete() {
        if(loading) return;

        loading = true;

        await deleteRole(role.id);

        if($page.params.slug == role.id) {
            goto("/settings/roles");

            $sidebar = true;
        }

        handleClick();

        loading = false;
    }

    function handleClick() {
        open = !open;
    }
</script>

<button class="hidden {($client == undefined || $client.permissions == undefined || !$client.permissions.includes('MANAGE_ROLES') || $client.level == undefined || $client.level <= role.level) ? "" : "group-hover:block"}" on:click|stopPropagation={handleClick} transition:fade="{{ duration: 100 }}">
    <Icon icon=delete scale="1.15rem"></Icon>
</button>

<DeleteDialog bind:open {role} on:delete={handleDelete}></DeleteDialog>

