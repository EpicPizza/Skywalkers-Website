<script lang=ts>
    import Dialog from "$lib/Builders/Dialog.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Loading from "$lib/Builders/Loading.svelte";
    import { doc, runTransaction } from "firebase/firestore";
    import type { DiscordRole, Role } from "./role";
    import Icon from "$lib/Builders/Icon.svelte";
    import { getContext } from "svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import type { createCurrentTeam, createPermissions } from "$lib/stores";
    import type { Writable } from "svelte/store";

    let client = getContext('client') as ReturnType<typeof firebaseClient>;
    const permissions = getContext('permissions') as ReturnType<typeof createPermissions>;
    const currentTeam = getContext('currentTeam') as ReturnType<typeof createCurrentTeam>;
    const team = getContext('team') as Writable<string>;

    export let role: Role;
    export let discord: Promise<DiscordRole[]>;
    
    let open = false;

    $: loadRoles(open);

    let rolesPromise: Promise<DiscordRole[]> = discord;

    function promiseState(p: Promise<any>) {
        const t = {};
        return Promise.race([p, t])
            .then(v => (v === t)? "pending" : "fulfilled", () => "rejected");
    }

    let timestamp = new Date(); //prevent role data from getting stale

    async function loadRoles(value: boolean) {
        if(!open) return;

        selected = undefined;

        if(new Date().valueOf() - timestamp.valueOf() > 1000 * 60 * 5 || ( connectedTo == -1 && role.connectTo != null )) {
            rolesPromise = new Promise(async (resolve) => {
                const result = await fetch("/t/" + $team + "/api/discord/roles/get", {
                    method: "POST",
                })

                resolve(await result.json() as DiscordRole[]);
            })

            timestamp = new Date();
        }

        roles = await rolesPromise;

        for(let i = 0; i < roles.length; i++) {
            if(roles[i].id == role.connectTo) {
                selected = i;
            }
        }
    }

    $: {
        rolesPromise.then((newRoles) => {
            connectedTo = -1;

            for(let i = 0; i < newRoles.length; i++) {
                if(newRoles[i].id == role.connectTo) {
                    connectedTo = i;
                }
            }
        }); 
    }

    let connectedTo: number;

    let roles: DiscordRole[];

    let selected: undefined | number;

    async function handleConnect(index: number) {
        await fetch("/t/" + $team + "/api/roles/connect", {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                role: role.id,
                id: index == -1 ? null : roles[index].id
            }),
        });

        open = !open;
    }
</script>

<button on:click={() => { open = !open; }} disabled={(!$permissions.includes('MANAGE_ROLES') || $currentTeam == undefined || $currentTeam.level == undefined || $currentTeam.level <= role.level)} class="bg-zinc-200 dark:bg-zinc-600 p-2 px-3 rounded-lg hover:opacity-90 disabled:hover:opacity-100 disabled:cursor-not-allowed trnasition disabled:opacity-40 hover:disabled:opacity-40">
    {#if role.connectTo == null}
        Select Discord Role
    {:else}
        {#await rolesPromise}
            <div class="flex justify-around">
                <div class="w-6 h-6 border-[2px] border-transparent dark:border-transparent border-t-text-light rounded-full dark:border-t-text-dark animate-spin"></div>
            </div>
        {:then roles}
            {#if connectedTo != -1}
                <div class="flex items-center">
                    <div style="background-color: {roles[connectedTo].color};" class="w-5 h-5 mr-1.5 rounded-full"></div>
                    <p class="pr-1">{roles[connectedTo].name}</p>
                </div>
            {:else}
                Role Not Found, Try Refreshing
            {/if}
        {/await}
    {/if}
</button>

<Dialog bind:isOpen={open} width=24rem>
    <h1 slot=title class="text-2xl">Connect Discord Role</h1>

    <div slot=description>
        <Line class="mt-4"></Line>
    </div>

    <div slot=content class="py-2 h-[calc(100dvh-17rem)] overflow-auto overflow-y-visible">
        {#await rolesPromise}
            <div class="flex justify-around">
                <Loading></Loading>
            </div>
        {:then}
            {#if role.connectTo != null}
                <button on:click={() => { selected = -1; }} class="flex w-full items-center transition rounded-md p-2 mb-1 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10">
                    <Icon icon=cancel class="mr-2"></Icon>
                    <p>Remove Role</p>
                </button>
            {/if}
            {#each roles as discordRole, i}
                <button on:click={() => { selected = i; }} class="flex w-full items-center transition rounded-md p-2 mb-1 bg-black dark:bg-white {selected == i ? "bg-opacity-10 dark:bg-opacity-10" : "bg-opacity-0 dark:bg-opacity-0"} hover:bg-opacity-10 dark:hover:bg-opacity-10">
                    <div style="background-color: {discordRole.color};" class="w-6 h-6 mr-2 rounded-full"></div>
                    <p>{discordRole.name}</p>
                </button>
            {/each}
        {/await}
    </div>

    <Line class="mb-4"></Line>

    <div class="flex justify-between">
        <div>
            {#if selected != undefined && selected > -1}
                <div class="flex w-auto items-center transition rounded-md px-3 py-[7px] bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10">
                    <div style="background-color: {roles[selected].color};" class="w-4 h-4 mr-2 rounded-full"></div>
                    <p class="text-sm">{roles[selected].name}</p>
                </div>
            {:else if selected != undefined}
                <div class="flex w-auto items-center transition rounded-md px-3 py-[7px] bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10">
                    <p class="text-sm">Removing Role</p>
                </div>
            {/if}
        </div>
        <div>
            <button class="b-default mr-1" on:click={(e) => { e.preventDefault(); open = !open }}>Cancel</button>
            <button on:click={() => { if(selected != undefined) { handleConnect(selected); } }} disabled={selected == undefined} class="b-green disabled:opacity-50 disabled:cursor-not-allowed">{selected == -1 ? "Save" : "Connect"}</button>
        </div>
    </div>
</Dialog>
