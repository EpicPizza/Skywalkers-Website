<script lang=ts>
    import Dialog from "$lib/Builders/Dialog.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import { client, type SecondaryUser } from "$lib/Firebase/firebase";
    import type { Unsubscriber } from "svelte/store";
    import { onDestroy, onMount } from "svelte";
    import { collection, collectionGroup, getDocs, getDocsFromCache, getDocsFromServer, query, where } from "firebase/firestore";
    import Loading from "$lib/Builders/Loading.svelte";

    export let value: string;
    export let name: string;
    let style: string = "";
    export { style as class }

    let open: boolean = false;
    let search: string = "";
    let selected: SecondaryUser | undefined;

    function handleClick() {
        open = !open;
        console.log("clicked");
        selected = undefined;

        for(let i = 0; i < users.length; i++) {
            if(users[i].id == value) {
                selected = users[i];
            }  
        }

        console.log(selected);
    }

    let unsubscribe: Unsubscriber;

    let users = new Array<SecondaryUser>();

    onMount(() => {
        unsubscribe = client.subscribe(async (user) => {
            if(user == undefined || 'preload' in user || user.role == undefined) { return; } //checking firebase sdk has loaded and user is verified

            let res = await fetch("/api/users/list", {
                method: 'POST',
            })

            let data = await res.json();

            console.log(data);

            users = data.users == undefined ? [] : data.users;

            data.users.forEach((secondaryUser: SecondaryUser) => {
                client.cacheUser(secondaryUser);
            });

            //const db = client.getFirestore(); 

            //TODO: pagination

            //const userDocs = query(collection(db, "users"), where("team", "==", user.team));

            //console.log(userDocs);

            /*let newUsers = new Array<SecondaryUser>();

            userDocs.forEach((snapshot) => {
                newUsers.push({
                    id: snapshot.id,
                    displayName: snapshot.data().displayName,
                    photoURL: snapshot.data().photoURL,
                    team: snapshot.data().team,
                    role: snapshot.data().role,
                })   

                if(snapshot.id == value) {
                    selected = newUsers[newUsers.length - 1];
                }  
            })

            users = newUsers;*/
        })
    })

    onDestroy(() => {
        if(unsubscribe) {
            unsubscribe();
        }
    })
</script>

<input autocomplete="off" type='text' bind:value name={name} class={style}/>
<button class="-ml-[1.5rem] -translate-x-[0.25rem]" on:click={(e) => { e.preventDefault(); handleClick(); }}>
    <Icon scale=1.25rem icon=person></Icon>
</button>

<Dialog bind:isOpen={open}>
    <h1 class="text-2xl" slot=title>Choose a Person</h1>

    <div slot=description class="mt-4">
        <div class="flex">
            <input bind:value={search} class="w-full h-[2.125rem] p-2 rounded-md bg-zinc-200 dark:bg-zinc-700" placeholder="Search"/>
            <button on:click={() => {search = "";}} class="px-2 mb-4 h-[2.125rem] ml-2 bg-blue-500 text-white dark:text-white rounded-md hover:opacity-95 transition">Clear</button>
        </div>
        <Line></Line>
    </div>

    <div slot="content" class="pb-2 overflow-scroll h-[calc(100dvh-17rem)] /* <<< skull emoji */">
        {#each users as user}
            {#if search == "" || user.displayName.includes(search)}
                <button on:click={() => {selected = user;}} class="mt-2 flex items-center p-2 bg-black dark:bg-white {selected && selected.id == user.id ? 'bg-opacity-20' : 'bg-opacity-5'} {selected && selected.id == user.id  ? 'dark:bg-opacity-20' : 'dark:bg-opacity-5'} hover:bg-opacity-20 dark:hover:bg-opacity-20 w-full transition rounded-lg">
                    <img class="rounded-full h-12 w-12" alt={user.displayName + " Profile"} src={user.photoURL}/>
                    <div class="ml-3 overflow-hidden whitespace-nowrap overflow-ellipsis">
                        <h1 class="text-left">{user.displayName}</h1>
                        <h2 class="text-left text-sm opacity-80">{user.role.substring(0, 1).toUpperCase() + user.role.substring(1, user.role.length)} <span class="opacity-50">- {user.id}</span></h2>
                    </div>
                </button>
            {/if}
        {:else}
            <div class="w-full h-16 flex items-center justify-around">
                <Loading></Loading>
            </div>
        {/each}
    </div>

    <Line></Line>

    <div class="w-full flex flex-row-reverse justify-between items-center mt-4">
        <div>
            <button on:click={() => {open = false;}} class="b-default">
                Cancel
            </button>
            <button disabled={selected == undefined} on:click={() => {if(selected != undefined) { open = false; value = selected.id; }}} class="b-green ml-2 disabled:opacity-50">
                Select
            </button>
        </div>
        {#if selected != undefined}
            <div class="flex items-center bg-zinc-200 dark:bg-zinc-600 rounded-full p-1 pr-3">
                <img referrerpolicy="no-referrer" class="inline-block h-[1.625rem] w-[1.625rem] rounded-full" alt="{selected.displayName} Profile" src={selected.photoURL}>
                <span class="text-[1rem] ml-1.5">{selected.displayName}</span>
            </div>
        {/if}
    </div>
</Dialog>