<script lang=ts>
    import Dialog from "$lib/Builders/Dialog.svelte";
    import { createEventDispatcher } from "svelte";
    import type { Role as RoleType } from "./role";

    export let role: RoleType;
    export let open: boolean;

    const dispatch = createEventDispatcher();

    let initialFocus: HTMLElement;
</script>

<Dialog bind:isOpen={open} width="24rem" {initialFocus}>
    <h1 class="text-2xl" slot=title>Delete Role</h1>

    <div slot=content class="mt-6">
        <p>Are you sure you want to delete <span class="font-extrabold">{role.name}</span>?</p>
        <div class="flex flex-row-reverse mt-6">
            <button on:click={() => { dispatch("delete") }} class="b-green w-16">Yes</button>
            <button bind:this={initialFocus} on:click={() => open = !open} class="b-red mr-2 w-16">No</button>
        </div>
    </div>
</Dialog>