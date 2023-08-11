<script lang=ts>
    import Dialog from "$lib/Builders/Dialog.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import { superForm } from "sveltekit-superforms/client";
    import type { SuperValidated } from "sveltekit-superforms";
    import Error from "$lib/Builders/Error.svelte"
    import Loading from "$lib/Builders/Loading.svelte";
    import type { Code } from "./codes";

    let initialFocus: HTMLElement;

    export let data: SuperValidated<any>;
    export let open: boolean;
    export let selected: string[];
    export let codes: Map<string, Code>;

    let { form, allErrors, message, enhance, delayed, tainted, reset } = superForm(data);

    $: {
        if($message && $message == "Edited Code") {
            open = false;
        }
    }

    $: {
        if(open == false) {
            $tainted = {};
        } else {
            if(selected.length != 1) { 
                open = false; 
            } else {
                let currentCode = codes.get(selected[0]);

                if(currentCode == undefined) { 
                    open = false; 
                } else {
                    reset({
                        data: {
                            role: currentCode.role,
                            email: currentCode.access == 'anyone' ? "" : currentCode.access,
                            code: selected[0],
                        }
                    })
                }
            }
        }
    }
</script>

<Dialog bind:isOpen={open} width=22rem {initialFocus}>
    <h1 class="text-2xl" slot=title>Generate Codes</h1>

    <div slot=content>
        <Line class="my-4"></Line>

        <form method=POST action=?/edit use:enhance>    
            <div class="flex items-center">
                <p class="text-lg">Member main role:</p>
                <select bind:value={$form.role} class="px-1 py-2 w-32 ml-2 rounded-md" name=role>
                    <option value="student">student</option>
                    <option value="parent">parent</option>
                    <option value="mentor">mentor</option>
                </select>
            </div>

            <input bind:value={$form.code} name=code class="hidden"/>

            <p class="text-lg mt-2">Restrict to email:</p>
            <input bind:value={$form.email} name=email class="mt-2 w-full rounded-md p-2"/>
    
            <Error {allErrors} {message} disallowMessage="Edited Code"></Error>

            <p class="text-sm opacity-50 mt-2">Leave email field blank to give access to anyone.</p>
    
            <Line class="my-4"></Line> 
    
            <div class="flex flex-row-reverse">
                <button class="b-green ml-2">Save</button>
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