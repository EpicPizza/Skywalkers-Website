<script lang=ts>
    import { getContext } from "svelte";
    import type { Battery } from "./batteries";
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import { slide } from "svelte/transition";
    import Line from "$lib/Builders/Line.svelte";
    import { arrayUnion, doc, updateDoc } from "firebase/firestore";
    import Member from "$lib/Components/Member.svelte";
    import dnt from 'date-and-time';
    import meridiem from "date-and-time/plugin/meridiem";
    import type { Writable } from "svelte/store";

    dnt.plugin(meridiem);

    export let open = false;

    export let battery: Battery;

    const client = getContext("client") as ReturnType<typeof firebaseClient>;
    const team = getContext("team") as Writable<string>;

    let message = "";

    function sendMessage() {
        const database = client.getFirestore();

        const ref = doc(database, "teams", $team ?? "000000", "batteries", battery.code);

        updateDoc(ref, {
            history: arrayUnion({
                timestamp: new Date(),
                message: message,
                author: $client?.uid,
            })
        })

        message = "";
    }
</script>

<slot open={() => { open = !open; }}></slot>

{#if open && $client != undefined}
    <div tabindex="-1" transition:slide class="w-full overflow-auto pt-4">
        <Line class="mb-3"></Line>
        <div class="max-h-52 overflow-auto w-full">
            <div class="flex sm:items-center flex-col sm:flex-row gap-2 sm:gap-1.5 pr-0.5 mb-4 pt-1">
                <div class="flex items-center gap-1.5 pr-0.5 min-w-fit ml-1 sm:ml-0">
                    <img class="w-7 h-7 rounded-full" alt="{$client.displayName}{$client.pronouns ? " (" + $client.pronouns + ")" : ""}" src={$client.photoURL}>
                    <span class="whitespace-nowrap">{$client.displayName}{$client.pronouns ? " (" + $client.pronouns + ")" : ""}:</span>
                </div>
                <input on:click|stopPropagation bind:value={message} on:keypress={(e) => { if(e.key == "Enter") { sendMessage(); } }} class="rounded-md w-[calc(100%-2px)] p-1 m-0.5" placeholder="Type Message">
            </div>
            <div class="flex flex-col gap-2">
                {#each battery.history as message}
                    <Member id={message.author} let:member>
                        <div class="flex flex-col sm:flex-row items-start gap-3 border border-border-light dark:border-border-dark rounded-lg p-4 sm:p-0 sm:border-none">
                            {#await member}
                                <div class="h-7 w-20"></div>
                            {:then member}
                                <div class="flex items-center gap-1.5 min-w-fit">
                                    <img class="w-7 h-7 rounded-full" alt="{member.displayName}{member.pronouns ? " (" + member.pronouns + ")" : ""}" src={member.photoURL}>
                                    <span class="whitespace-nowrap">{member.displayName}{member.pronouns ? " (" + member.pronouns + ")" : ""}:</span>
                                </div>
                            {/await}
                            <p class="mt-[2px] ml-1">{message.message}<span class="ml-2 text-xs opacity-50">({dnt.format(message.timestamp, "MM/DD/YYYY")})</span></p>
                        </div>
                    </Member>
                {:else}
                    <p class="font-bold text-center pt-1 pb-1.5">No Messages</p>
                {/each}
            </div>
        </div>
    </div>
{/if}