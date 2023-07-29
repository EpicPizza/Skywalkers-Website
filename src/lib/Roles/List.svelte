<script lang=ts>
    import { slide } from "svelte/transition";
    import type { Role } from "./role";
    import Line from "$lib/Builders/Line.svelte";
    import Loading from "$lib/Builders/Loading.svelte";
    import AddMemberDialog from "./AddMemberDialog.svelte";
    import { getContext } from "svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase";

    let client = getContext('client') as ReturnType<typeof firebaseClient>;

    export let role: Role;   

    let loading = false;

    async function handleRemove(id: string) {
        if(loading) return;

        loading = true;

        await fetch("/api/roles/remove", {
            method: 'POST',
            body: JSON.stringify({
                uid: id,
                role: role.id
            })
        })

        loading = false;
    }

    let open = false;
</script>

<AddMemberDialog {role} bind:open></AddMemberDialog>

<div in:slide style="background: {role.color};" class="w-full p-4 absolute z-20 top-12 right-0 h-[calc(100dvh-7rem)]">
    <div class="p-4 pt-0 w-full h-full overflow-scroll bg-backgroud-light dark:bg-backgroud-dark rounded-xl relative">
        <div class="flex justify-between items-center h-[4.125rem]">
            <h1 class="text-2xl font-bold">{role.name}</h1>
            {#if !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('MANAGE_ROLES') || $client.level == undefined || $client.level <= role.level)}
                <button on:click={() => { open = !open; }} class="b-default">Add</button>
            {/if}
        </div>

        <Line class="mb-4"></Line>

        {#await role.members}
            <div class="w-full pt-8 flex justify-around">
                <Loading></Loading>
            </div>
        {:then members}
            {#each members as member}
                <div class="flex justify-between items-center mb-3">
                    <div class="flex items-center">
                        <img class="h-9 w-9 rounded-full" referrerpolicy="no-referrer" alt="{member.team}'s profile" src={member.photoURL} />
                        <p class="text-lg ml-2 font-light">{member.displayName}{member.pronouns ? " (" + member.pronouns + ")" : ""}</p>
                    </div>
                    <div class="flex items-center gap-3">
                        {#if !($client == undefined || $client.permissions == undefined || !$client.permissions.includes('MANAGE_ROLES') || $client.level == undefined || $client.level <= role.level)}
                            <button class="b-default h-[2.125rem]" on:click={() => { handleRemove(member.id) }}>Remove</button>
                        {/if}
                    </div>
                </div>
            {:else}
                <div class="w-full text-center text-lg font-bold text-red-500">
                    No one has this role.
                </div>
            {/each}
        {/await}
    </div>
</div>

