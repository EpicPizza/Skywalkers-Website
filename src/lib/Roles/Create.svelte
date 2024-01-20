<script lang=ts>
    import { goto } from "$app/navigation";
    import Dialog from "$lib/Builders/Dialog.svelte";
    import Error from "$lib/Builders/Error.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Loading from "$lib/Builders/Loading.svelte";
    import { superForm } from "sveltekit-superforms/client";
    import type { SuperValidated } from "sveltekit-superforms";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    
    let sidebar = getContext('sidebar') as Writable<boolean>;
    let clicked = getContext('clicked') as Writable<boolean>;
    let team = getContext('team') as Writable<string>;

    let open: boolean = false;
    let colorElement: HTMLElement;
    let createForm: SuperValidated<any>;
    export { createForm as form };

    function handleClick() {
        open = !open;

        form.set({
            name: "",
            color: "#000000"
        })
        tainted.set({});
        reset();
    }

    const { tainted, allErrors, reset, message, form, enhance, delayed } = superForm(createForm);

    $: {
        if($message && $message.includes("Role Added")) {
            open = false;

            if($message.length > "Role Added at ".length) {
                goto("/t/" + $team + "/settings/roles/" + $message.substring("Role Added at ".length, $message.length));
            }

            $sidebar = false;
        }
    }

    $: ((open) => { 
        form.set({
            name: "",
            color: "#000000"
        })
        tainted.set({});
        reset();
    })(open);

    let initialFocus: HTMLElement;
</script>

<button class="b-accent text-center" on:click={handleClick}>
    Create Role
</button>

<Dialog bind:isOpen={open} width="24rem" bind:initialFocus={initialFocus}>
    <h1 class="text-2xl" slot=title>Create Role</h1>

    <div slot=content class="mt-4">
        <form method="POST" use:enhance action="/t/{$team}/api/roles/create"> <!-- No actions allowed on layouts, so I instead put the action in a seperate url. -->
            <Line class="mb-4"></Line>
            <div class="flex items-center">
                <h2 class="text-lg mr-2">Name:</h2>
                <input name=name bind:value={$form.name} class="rounded-md p-1 w-full">
            </div>
            <div class="flex items-center mt-3">
                <h2 class="text-lg mr-2">Color:</h2>
                <div class="w-6 h-6 hover:cursor-pointer rounded-full overflow-hidden">
                    <input tabindex=-1 name=color bind:value={$form.color} bind:this={colorElement} type="color" class="w-12 h-12 -translate-x-2 -translate-y-2">
                </div>
                <button class="ml-1" on:click={(e) => {
                    e.preventDefault();
                    if(colorElement) {
                        colorElement.click();
                    }
                }}>
                    <Icon icon=edit scale="1.25rem"></Icon>
                </button>
            </div>
            <Error message={message} disallowMessage="Role Added" allErrors={allErrors}></Error>
            <Line class="my-4"></Line>

            <div class="flex flex-row-reverse">
                <button class="b-green">Create</button>
                <button bind:this={initialFocus} class="b-default mr-2 ml-2" on:click={(e) => { e.preventDefault(); open = !open }}>Cancel</button>
                {#if $delayed}
                    <div class="scale-75 flex items-center h-[2.125rem] overflow-hidden">
                        <Loading></Loading>
                    </div>
                {/if}
            </div>        
        </form>
    </div>
</Dialog>