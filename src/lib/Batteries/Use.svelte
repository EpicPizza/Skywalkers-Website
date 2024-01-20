<script lang=ts>
    import { getContext } from "svelte";
    import Menu from "./Menu.svelte";
    import type { Battery } from "./batteries";
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import { doc, updateDoc } from "firebase/firestore";
    import type { Writable } from "svelte/store";

    export let battery: Battery;

    const client = getContext("client") as ReturnType<typeof firebaseClient>;
    const team = getContext("team") as Writable<string>;

    async function changeUse(use: string) {
        console.log(use);

        const database = client.getFirestore();

        const ref = doc(database, "teams", $team ?? "000000", "batteries", battery.code);

        await updateDoc(ref, {
            use: use,
        })
    }
</script>

<Menu choices={['Competition', 'Practice', 'Testing', 'Decommissioned', 'Unknown']} selected={battery.use} on:select={(e) => { changeUse(e.detail) }}>
    <div class="h-8 sm:h-fit flex sm:block flex-col justify-around items-center whitespace-nowrap rounded-lg px-1 sm:px-0 sm:bg-transparent dark:sm:bg-transparent bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10 w-full">
        <span>
            Use: 
            {#if battery.use == 'Competition'}
                <span class="text-green-600 dark:text-green-400 font-extrabold">Competition</span>
            {:else if battery.use == 'Practice'}
                <span class="text-yellow-600 dark:text-yellow-400 font-extrabold">Practice</span>
            {:else if battery.use == 'Testing'}
                <span class="text-yellow-600 dark:text-yellow-400 font-extrabold">Testing</span>
            {:else if battery.use == 'Decommissioned'}
                <span class="text-red-600 dark:text-red-400 font-extrabold">Decommissioned</span>
            {:else if battery.use == 'Unknown'}
                <span class="font-extrabold">Unknown</span>
            {/if}
        </span>
    </div>
</Menu>