<script lang=ts>
    import { getContext } from "svelte";
    import Menu from "./Menu.svelte";
    import type { Battery } from "./batteries";
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import { doc, updateDoc } from "firebase/firestore";

    export let battery: Battery;

    const client = getContext("client") as ReturnType<typeof firebaseClient>;

    async function changeCondition(condition: string) {
        console.log(condition);

        const database = client.getFirestore();

        const ref = doc(database, "teams", $client?.team ?? "000000", "batteries", battery.code);

        await updateDoc(ref, {
            condition: condition,
        })
    }
</script>

<Menu choices={['Good', 'Fair', 'Bad', 'Unknown']} selected={battery.condition} on:select={(e) => { changeCondition(e.detail) }}>
    <div class="h-8 sm:h-fit flex sm:block flex-col justify-around items-center whitespace-nowrap rounded-lg px-1 sm:px-0 sm:bg-transparent dark:sm:bg-transparent bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10 w-full">
        <span>
            Condition: 
            {#if battery.condition == 'Good'}
                <span class="text-green-600 dark:text-green-400 font-extrabold">Good</span>
            {:else if battery.condition == 'Fair'}
                <span class="text-yellow-600 dark:text-yellow-400 font-extrabold">Fair</span>
            {:else if battery.condition == 'Bad'}
                <span class="text-red-600 dark:text-red-400 font-extrabold">Bad</span>
            {:else if battery.condition == 'Unknown'}
                <span class="font-extrabold">Unknown</span>
            {/if}
        </span>
    </div>
</Menu>