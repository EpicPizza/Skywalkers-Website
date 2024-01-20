<script lang=ts>
    import Dialog from "$lib/Builders/Dialog.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import { superForm } from "sveltekit-superforms/client";
    import type { SuperValidated } from "sveltekit-superforms";
    import Error from "$lib/Builders/Error.svelte"
    import Loading from "$lib/Builders/Loading.svelte";

    let initialFocus: HTMLElement;

    export let data: SuperValidated<any>;
    export let open: boolean;

    let { form, allErrors, message, enhance, delayed, tainted } = superForm(data);

    $: {
        if($message && $message == "Generated Codes") {
            open = false;
        }
    }

    $: {
        if(open == false || open == true) {
            $tainted = {};
        }   
    }
</script>

<Dialog bind:isOpen={open} width=22rem {initialFocus}>
    <h1 class="text-2xl" slot=title>Invite</h1>

    <div slot=content>
        <Line class="my-4"></Line>

        <form method=POST action=?/generate use:enhance>
            <div class="flex items-center mt-2">
                <p class="text-lg">Main role:</p>
                <select bind:value={$form.role} class="px-1 py-2 w-32 ml-2 rounded-md" name=role>
                    <option value="student">student</option>
                    <option value="parent">parent</option>
                    <option value="mentor">mentor</option>
                </select>
            </div>

            <div class="flex items-center gap-2 mt-1">
                <p class="text-lg mt-3">Email:</p>
            <input placeholder="example@gmail.com" bind:value={$form.emails} name=emails class="mt-2 w-full rounded-md p-2"/>
            </div>
    
            <Error {allErrors} {message} disallowMessage="Generated Codes"></Error>

            <Line class="my-4"></Line>
    
            <div class="flex flex-row-reverse">
                <button class="b-green ml-2">Invite</button>
                <button bind:this={initialFocus} on:click|preventDefault={() => { open = !open; }} class="b-default ml-1">Cancel</button>
                {#if $delayed}
                    <div class="scale-75 flex items-center h-[2.125rem] overflow-hidden">
                        <Loading></Loading>
                    </div>
                {/if}
            </div>
        </form>
    </div>
</Dialog>