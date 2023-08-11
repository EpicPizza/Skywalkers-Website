<script lang=ts>
    import Dialog from "$lib/Builders/Dialog.svelte";
    import Error from "$lib/Builders/Error.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Loading from "$lib/Builders/Loading.svelte";
    import type { SecondaryUser, firebaseClient } from "$lib/Firebase/firebase";
    import { superForm } from "sveltekit-superforms/client";
    import type { z } from "zod";
    import type { EditProfile } from "./members";
    import { getContext } from "svelte";
    import type { SuperValidated } from "sveltekit-superforms";

    let editProfileForm: SuperValidated<typeof EditProfile>;

    export { editProfileForm as form};

    export let member: SecondaryUser;
    
    let client = getContext('client') as ReturnType<typeof firebaseClient>;

    let open = false;  

    const { form, reset, tainted, delayed, allErrors, message, enhance } = superForm(editProfileForm);

    function handleEditProfile() {
        reset({
            data: {
                name: member.displayName,
                pronouns: member.pronouns,
                id: member.id,
            }
        })
        open = !open;
    }

    $: {
        if(open == false) {
            tainted.set({});
        }
    }

    $: {
        if($message == "Edited Profile") {
            open = false;
        }
    }

    let initialFocus: HTMLElement;
</script>

<slot {handleEditProfile} />

<Dialog bind:isOpen={open} width=24rem bind:initialFocus>
    <h1 class="text-2xl" slot=title>Edit Profile</h1>

    <form method=POST action=?/edit use:enhance slot=content>
        <Line class="my-4"></Line>
        <div class="flex items-center">
            <label for="name" class="mr-2 text-lg">Name:</label>
            <input bind:value={$form.name} class="rounded-md p-1 w-full" id="name" name="name"/>
        </div>  
        <input bind:value={$form.id} id="id" name="id" class="hidden"/>
        <div class="flex items-center mt-2">
            <label for="pronouns" class="mr-2 text-lg">Pronouns:</label>
            <input bind:value={$form.pronouns} class="rounded-md p-1 w-full" id="pronouns" name="pronouns"/>
        </div>
        <Error {allErrors} {message} disallowMessage="Edited Profile"></Error>
        <Line class="my-4"></Line>
        <div class="flex flex-row-reverse">
            <button class="b-green">Save</button>
            <button bind:this={initialFocus} on:click|preventDefault={() => { open = !open; }} class="b-default mr-2 ml-1">Cancel</button>
            {#if $delayed}
                <div class="scale-75 flex items-center h-[2.125rem] overflow-hidden">
                    <Loading></Loading>
                </div>
            {/if}
        </div>
    </form>
</Dialog>