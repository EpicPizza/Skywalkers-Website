<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import Add from "$lib/Batteries/Add.svelte";
    import { getContext, onMount } from "svelte";
    import type { Unsubscribe } from "firebase/auth";
    import type { Unsubscriber, Writable } from "svelte/store";
    import { CollectionReference, Query, collection, documentId, onSnapshot, orderBy, query } from "firebase/firestore";
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import type { Battery } from "$lib/Batteries/batteries";
    import type { Warning, createCurrentTeam } from "$lib/stores";
    import Print from "$lib/Batteries/Print.svelte";
    import BatteryComp from "$lib/Batteries/Battery.svelte";
    import { flip } from "svelte/animate";
    import Menu from "$lib/Batteries/Menu.svelte";
    import { page } from "$app/stores";

    export let data;

    let open = false;
    let unsubscribeUser: Unsubscribe;
    let unsubscribeBatteries: Unsubscriber;
    
    let client = getContext("client") as ReturnType<typeof firebaseClient>;
    let warning = getContext('warning') as Writable<Warning | undefined>;
    let team = getContext('team') as Writable<string>;
    let teamInfo = getContext('teamInfo') as Writable<Map<string, { name: string, website: string, icon: string }>>
    let currentTeam = getContext('currentTeam') as ReturnType<typeof createCurrentTeam>;

    $: info = $teamInfo.get($page.params.team == undefined ? ($currentTeam ? $currentTeam.team : "000000") : $page.params.team);

    let batteries: Battery[] = data.batteries;

    let initial = true;

    let toPrint = new Array<string>();

    let id = $page.url.searchParams.get('id');

    onMount(() => {
        unsubscribeUser = client.subscribe((user) => {
            if(user == undefined || 'preload' in user || user.teams == undefined) return;

            if(unsubscribeUser) unsubscribeUser();
            if(unsubscribeBatteries) unsubscribeBatteries();

            const db = client.getFirestore();
            const ref = collection(db, "teams", $team, "batteries");

            unsubscribeBatteries = listener(ref);
        })
    })

    function listener(ref: CollectionReference | Query) {
        return onSnapshot(ref, async (snapshot) => {
            if(!initial) {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        warning.set({
                            message: 'Battery #' + change.doc.id + ' Added',
                            color: 'default'
                        })
                    } else if(change.type == 'removed') {
                        warning.set({
                            message: 'Battery #' + change.doc.id + ' Deleted',
                            color: 'default'
                        })
                    }
                });
            }

            initial = false;

            let newBatteries: Battery[] = [];

            for(let i = 0; i < snapshot.docs.length; i++) {
                let history: Battery["history"] = [];

                for(let j = 0; j < snapshot.docs[i].data().history.length; j++) {
                    history.push({
                        author: snapshot.docs[i].data().history[j].author,
                        message: snapshot.docs[i].data().history[j].message,
                        timestamp: snapshot.docs[i].data().history[j].timestamp.toDate(),
                    })
                }

                history.sort(( a, b ) => b.timestamp.valueOf() - a.timestamp.valueOf() )

                newBatteries.push({
                    condition: snapshot.docs[i].data().condition,
                    lastchecked: snapshot.docs[i].data().lastchecked.toDate(),
                    use: snapshot.docs[i].data().use,
                    code: snapshot.docs[i].id,
                    history: history,
                })
            }

            batteries = newBatteries;
        })
    }

    function refilter(filter: string, ascending: boolean) {
        if(initial) return;

        initial = true;

        if(unsubscribeBatteries) unsubscribeBatteries();

        const db = client.getFirestore();
        const ref = collection(db, "teams", $team, "batteries");
        const q = query(ref, orderBy(filter.toLocaleLowerCase().replaceAll(" ", "") == "code" ? documentId() : filter.toLocaleLowerCase().replaceAll(" ", ""), ascending ? "asc" : "desc"));

        unsubscribeBatteries = listener(q);
    }

    function includes(id: string) {
        for(let i = 0; i < batteries.length; i++) {
            if(batteries[i].code == id) {
                return true;
            }
        }

        return false;
    }

    function getBattery(id: string) {
        for(let i = 0; i < batteries.length; i++) {
            if(batteries[i].code == id) {
                return batteries[i];
            }
        }

        return batteries[0];
    }

    let filter = "Code";
    let ascending = true;

    $: refilter(filter, ascending);
</script>

<svelte:head>
    <title>{info?.name ?? "Skywalkers"} | Batteries</title>
</svelte:head>

<Add addForm={data.form} bind:open={open}></Add>

<div class="flex justify-around p-8 pt-[7.875rem] min-h-[100dvh]">
    <div class="w-[42rem] min-w-[15-rem]">
        <div class="flex w-full justify-between items-center">
            <h1 class="text-2xl">Battery Inventory</h1>
            <button class="b-primary h-fit" on:click={() => { open = !open; }}>Add Entry</button>
        </div>
        {#key batteries}
            {#if batteries.length > 0 && id != null && includes(id)}
                <div class="mb-4 mt-5">
                    <div class="flex items-center gap-1 opacity-75 mb-3">
                        <Icon scale=1.4rem icon=push_pin></Icon>
                        Pinned
                    </div>
                    <BatteryComp bind:toPrint battery={batteries[batteries.indexOf(getBattery(id))]}></BatteryComp>
                </div>
            {/if}
        {/key}
        <div class="flex items-center justify-between mb-3 mt-4">
            <div>
                <Menu selected={filter} choices={["Code", "Last Checked", "Use", "Condition"]} on:select={(e) => { filter = e.detail; }}>
                    <button class="flex items-center gap-1 opacity-75">
                        <Icon scale=1.4rem icon=sort></Icon>
                        Sort
                    </button>
                </Menu>
            </div>
            <button on:click={() => { ascending = !ascending; }}>
                <Icon scale=1.2rem icon=sync_alt class="rotate-90 opacity-75"></Icon>
            </button>
        </div>
        {#each batteries as battery (battery.code)}
            <div animate:flip={{ duration: 500 }}>
                <BatteryComp bind:toPrint {battery}></BatteryComp>
            </div>
        {:else}
            <div class="w-full p-4 border-[1px] h-[6.8rem] rounded-lg border-border-light dark:border-border-dark mb-4 flex items-center justify-around">
                <p>No Battery Entries</p>
            </div>
        {/each}
        <Print bind:toPrint></Print>
    </div>
</div>