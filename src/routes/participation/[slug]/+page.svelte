<script lang=ts>
    import { invalidate } from "$app/navigation";
    import Background from "$lib/Builders/Background.svelte";
    import Error from "$lib/Builders/Error.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Loading from "$lib/Builders/Loading.svelte";
    import Page from "$lib/Builders/Page.svelte";
    import Tooltip from "$lib/Builders/Tooltip.svelte";
    import Member from "$lib/Components/Member.svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import type { Hours } from "$lib/Hours/hours.server.js";
    import { doc } from "firebase/firestore";
    import { getContext, onMount } from "svelte";
    import type { Unsubscriber } from "svelte/store";
    import { onDestroy } from "svelte";
    import { superForm } from "sveltekit-superforms/client";

    let client = getContext('client') as ReturnType<typeof firebaseClient>;

    export let data;

    const { form, enhance, delayed, allErrors, message, reset } = superForm(data.forms.add, { clearOnSubmit: "errors-and-message" });

    $: {
        if($message == "Success") {
            reset();
        }
    }

    let unsubscribe: Unsubscriber | undefined = undefined;

    onMount(() => {
        if($client == undefined || $client.team == undefined) return;
        unsubscribe = client.doc<Hours | undefined>(doc(client.getFirestore(), "teams", $client.team, "hours", data.id), structuredClone(data.hours)).subscribe(async (snapshotData) => {
            if(snapshotData == undefined) {
                invalidate('hours:' + $client?.uid);
            } else {
                data.hours = snapshotData;
            }
        });
    });

    onDestroy(() => {
        if(unsubscribe) unsubscribe();
    })
</script>

<svelte:head>
    <title>Skywalkers | Hours</title>
</svelte:head>

{#if $client != undefined}
    <Background>
        <Page size=24rem expand>
            <h1 class="text-2xl font-bold text-center">{data.name}'s Participation</h1>
            <Line class="my-4 mt-2"></Line>
            <div class="bg-accent-light mb-4 dark:bg-accent-dark text-accent-text-light dark:text-accent-text-dark px-8 py-4 w-fit rounded-full ml-auto mr-auto">
                <p class="text-xl font-extrabold">Total: {data.hours.total} meeting{data.hours.total == 1 ? "" : "s"}</p>
            </div>
            <!--
            <div class="rounded-lg border-border-light dark:border-border-dark border-[1px] p-4 flex flex-col items-center gap-4 mb-6">
                <div class="flex items-center gap-2">
                    <Icon icon=add_circle></Icon>
                    <p>Add<span class="mx-0.5">/</span>Remove Hours</p>
                </div> 
                <div class="w-full">
                    <form method=POST use:enhance>
                        <textarea name=reason placeholder="Add Reason" bind:value={$form.reason} on:input={() => { $form.reason = $form.reason.replace(/\n/g, '') }} class="p-2 rounded-md w-full h-16 mb-0 whitespace-pre-wrap"/>
                        <div class="flex justify-between">
                            <div class="flex gap-1.5">
                                <button disabled={$form.hours <= -12} class="b-primary disabled:cursor-not-allowed w-9 h-9 flex items-center justify-around" on:click|preventDefault={() => { if($form.hours < -11.75) { $form.hours = -12; } else if($form.hours > 12) { $form.hours = 12; } else {  $form.hours -= 0.25; } }}><Icon scale=1.25rem icon=remove></Icon></button>
                                <input name=hours bind:value={$form.hours} class="p-1 px-2 w-[4.25rem] text-center font-bold rounded-md"/>
                                <button disabled={$form.hours >= 12} class="b-primary disabled:cursor-not-allowed w-9 h-9 flex items-center justify-around" on:click|preventDefault={() => { if($form.hours > 11.75) { $form.hours = 12; } else if($form.hours < -12) { $form.hours = 12; } else {  $form.hours += 0.25; } }}><Icon scale=1.25rem icon=add></Icon></button>
                            </div>
                            <div class="flex gap-2 items-center">
                                {#if $delayed}
                                    <div class="scale-75 flex items-center h-[2.125rem] overflow-hidden"><Loading></Loading></div>
                                {/if}
                                <button class="b-primary">
                                    {#if $form.hours < 0}
                                        Remove
                                    {:else}
                                        Add
                                    {/if}
                                </button>
                            </div>
                        </div>
                        <Error disallowMessage=Success {allErrors} {message}></Error>
                    </form>
                </div>
            </div>
            <h2 class="text-lg mb-2 font-bold">History:</h2>
            <Line class="mb-2"></Line>
            -->
            {#each [... data.hours.entries].reverse() as entry (entry.id)}
                <div class="flex items-center py-4 gap-4 w-full overflow-hidden {entry.total == 0 ? "opacity-50" : ""}">
                    <Icon scale=1.75rem style="color: {entry.history[entry.latest].indicator.color}" icon={entry.history[entry.latest].indicator.icon}></Icon>
                    <div class="grow w-full overflow-hidden flex gap-3 items-center">
                        {#if entry.history[entry.latest].id != null}
                            <Member silent id={entry.history[entry.latest].id ?? ""} let:member>
                                {#await member}
                                    <p hidden>Loading...</p>
                                {:then member}
                                    <Tooltip text="{member.displayName}{member.pronouns == "" ? "" : " (" + member.pronouns + ")"}">
                                        <img class="h-7 min-w-[1.75rem] w-7 rounded-full" alt="{member.displayName}'s profile" src={member.photoURL}/>
                                    </Tooltip>
                                {/await}
                            </Member>
                        {/if}
                        <svelte:element this={entry.history[entry.latest].link ? "a" : "p"} href={entry.history[entry.latest].link} class="{entry.history[entry.latest].link ? "text-blue-500 dark:text-blue-500 hover:underline" : ""} overflow-hidden overflow-ellipsis">
                            {entry.history[entry.latest].reason ?? "No Reason Given"}
                        </svelte:element>
                    </div>
                    <!--<span class="bg-black whitespace-nowrap dark:bg-white bg-opacity-10 ml-1 text-center dark:bg-opacity-10 p-1 px-2 rounded-lg">{entry.total} hour{entry.total == 1 ? "" : 's'}</span>-->
                </div>
            {:else}
                <p class="mb-4 pt-4 text-center font-bold text-red-500 dark:text-red-500">No History</p>
            {/each}
            <div class="-mb-4"></div>
        </Page>
    </Background>
{/if}