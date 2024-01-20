<script lang=ts>
    import dnt from "date-and-time";
    import meridiem from "date-and-time/plugin/meridiem";
    import type { Battery } from "./batteries";
    import DatePicker from "$lib/Builders/DatePicker.svelte";
    import { getContext } from "svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import { doc, updateDoc } from "firebase/firestore";
    import type { Writable } from "svelte/store";

    dnt.plugin(meridiem);

    export let battery: Battery;

    let open = false;

    $: date = battery.lastchecked;

    const client = getContext("client") as ReturnType<typeof firebaseClient>;
    const team = getContext("team") as Writable<string>;

    async function changeLastChecked() {
        const database = client.getFirestore();

        const ref = doc(database, "teams", $team ?? "000000", "batteries", battery.code);

        await updateDoc(ref, {
            lastchecked: date,
        })
    }
</script>

<DatePicker on:submit={changeLastChecked} hideTimes endTime={new Date()} bind:startTime={date} bind:open></DatePicker>

<button on:click|stopPropagation={() => { open = !open; }} class="text-base whitespace-nowrap text-left w-full sm:w-fit">
    <div class="h-8 sm:h-fit flex sm:block flex-col justify-around items-center whitespace-nowrap rounded-lg px-1 sm:px-0 sm:bg-transparent dark:sm:bg-transparent bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10 w-full">
        <span>
            Last Checked: 
            {#if new Date().valueOf() - battery.lastchecked.valueOf() > (1000 * 60 * 60 * 24 * 30 * 6)}
                <span class="text-red-600 dark:text-red-400 font-extrabold">{dnt.format(battery.lastchecked, "MM/DD/YYYY")}</span>
            {:else}
                <span>{dnt.format(battery.lastchecked, "MM/DD/YYYY")}</span>
            {/if}
        </span>
    </div>
</button>