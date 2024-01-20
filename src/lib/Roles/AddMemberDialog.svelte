<script lang=ts context=module>
    interface Cache {
        users: Promise<SecondaryUser[]>,
        cached: Date,
    }

    interface UndefinedCache {
        users: undefined,
        cached: undefined,
    }

    let cache: Cache | UndefinedCache = {
        users: undefined,
        cached: undefined,
    }
</script>

<script lang=ts>
    import Dialog from "$lib/Builders/Dialog.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Loading from "$lib/Builders/Loading.svelte";
    import type { Role } from "./role";
    import Member from "$lib/Components/Member.svelte";
    import { getContext, onMount } from "svelte";
    import type { firebaseClient, FirestoreUser, SecondaryUser } from "$lib/Firebase/firebase";
    import type { Unsubscriber, Writable } from "svelte/store";
    import { increment } from "firebase/firestore";

    let client = getContext('client') as ReturnType<typeof firebaseClient>;
    const team = getContext('team') as Writable<string>;

    export let open: boolean = false;
    export let role: Role;

    let unsubscribe: Unsubscriber;

    let usersPromise: Promise<SecondaryUser[]>;

    let users: SecondaryUser[] | undefined = undefined;

    onMount(async () => {
        if(cache.users != undefined && (new Date().valueOf() - cache.cached.valueOf()) < 1000 * 60 * 15) {
            usersPromise = cache.users;
            users = await cache.users;
        } else {
            cache = {
                cached: new Date(),
                users: new Promise((resolve) => {
                    unsubscribe = client.subscribe(async (user) => {
                        if(user == undefined || 'preload' in user || user.teams == undefined) { return; } //checking firebase sdk has loaded and user is verified

                        if(unsubscribe) {
                            unsubscribe();
                        }

                        let res = await fetch("/t/" + $team + "/api/users/list", {
                            method: 'POST',
                        })

                        let data = await res.json();


                        resolve(data.users == undefined ? [] : data.users);

                        /*data.users.forEach((secondaryUser: SecondaryUser) => {
                            client.cacheUser(secondaryUser.id, secondaryUser);
                        });*/

                        users = data.users == undefined ? [] : data.users;
                    })
                })
            }
            usersPromise = cache.users;
        }
    })

    let initialFocus: HTMLElement;

    let search: string = "";

    let selected: string[];

    async function handleAdd() {
        open = !open;
        let id = selected;
        selected = [];

        await fetch("/t/" + $team + "/api/roles/add", {
            method: 'POST',
            body: JSON.stringify({
                uid: id,
                role: role.id
            })
        })
    }

    $: {
        if(open == false) {
            selected = [];
        }
    }

    let areThereAny = false;

    function checkIfTheyAreAny(): boolean {
        if(users == undefined) return false;
        for(let i = 0; i < users.length; i++) {
            let found = false;

            for(let j = 0; j < role.members.length; j++) {
                if(role.members[j].id == users[i].id) {
                    found = true;
                }
            }

            if(found == false) {
                return true;
            }
        }

        return false;
    }

    function checkIfAlreadyHas(id: string) {
        areThereAny = checkIfTheyAreAny();

        let found = false;

        for(let j = 0; j < role.members.length; j++) {
            if(role.members[j].id === id) {
                found = true;
            }
        }

        return !found;
    }

    function getRole(user: FirestoreUser) {
        for(let i = 0; i < user.teams.length; i++) {
            if(user.teams[i].team == $team) {
                return user.teams[i].role;
            }
        }

        return "Unknown";
    }
</script>

<Dialog bind:isOpen={open} {initialFocus}>
    <h1 class="text-2xl" slot=title>Add Members to {role.name}</h1>

    <div slot=description>
        <div class="flex mt-4">
            <input bind:value={search} class="w-full h-[2.125rem] p-2 rounded-md bg-zinc-200 dark:bg-zinc-700" placeholder="Search"/>
            <button on:click={() => {search = "";}} class="px-2 mb-4 h-[2.125rem] ml-2 bg-blue-500 text-white dark:text-white rounded-md hover:opacity-95 transition">Clear</button>
        </div>
        <Line></Line>
    </div>

    <div slot=content class="min-h-[calc(100dvh-17rem)] overflow-auto overflow-y-visible">
        {#await usersPromise}
            <div class="w-full h-16 flex items-center justify-around">
                <Loading></Loading>
            </div>
        {:then users} 
            {#each users as user}
                {@const role = getRole(user)}
                {#if (search == "" || user.displayName.toLowerCase().includes(search.toLowerCase())) && checkIfAlreadyHas(user.id)}
                    <button on:click={() => { selected.includes(user.id) ? (() => { selected.splice(selected.indexOf(user.id), 1); selected = selected; })() : (() => { selected.push(user.id); selected = selected; })() }} class="mt-2 flex items-center p-2 bg-black dark:bg-white {selected.includes(user.id)  ? 'dark:bg-opacity-20 bg-opacity-20' : 'dark:bg-opacity-5 bg-opacity-5'} w-full transition rounded-lg">
                        <img class="rounded-full h-12 w-12" alt={user.displayName + " Profile"} src={user.photoURL}/>
                        <div class="ml-3 overflow-hidden whitespace-nowrap overflow-ellipsis">
                            <h1 class="text-left">{user.displayName}{user.pronouns == undefined || user.pronouns == "" ? "" : " (" + user.pronouns + ")"}</h1>
                            <h2 class="text-left text-sm opacity-80">{role.substring(0, 1).toUpperCase() + role.substring(1, role.length)} <span class="opacity-50">- {user.id}</span></h2>
                        </div>
                    </button>
                {/if}
            {:else}
                {#if areThereAny}
                    <div class="w-full h-16 flex items-center justify-around text-red-500 font-bold">
                        No Users Found
                    </div>
                {/if}
            {/each}
            {#if areThereAny == false}
                <div class="w-full h-16 flex items-center justify-around text-red-500 font-bold">
                    No Users Found
                </div>
            {/if}
        {/await}
    </div>

    <Line class="mb-4"></Line>

    <div class="flex flex-row-reverse justify-between">
        <div class="flex flex-row-reverse">
            <button on:click={handleAdd} disabled={selected.length == 0} class="b-green {selected.length == 0 ? "opacity-50 cursor-not-allowed" : ""}">Add</button>
            <button bind:this={initialFocus} class="b-default mr-2 ml-2" on:click={(e) => { e.preventDefault(); open = !open }}>Cancel</button>
        </div>
        <div class="flex w-auto items-center transition rounded-md px-3 py-[7px] bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10">
            <p class="text-sm">{selected.length} member{selected.length == 1 ? "" : "s"} choosen</p>
        </div>
    </div>
</Dialog>