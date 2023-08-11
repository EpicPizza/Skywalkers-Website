<script lang=ts>
    import type { Warning } from "$lib/stores";
    import { getContext, onDestroy } from "svelte";
    import type { Writable } from "svelte/store";
    import { superForm } from "sveltekit-superforms/client";
    import type { SuperValidated } from "sveltekit-superforms";
    import type { QuarantineMember } from "./members";
    import type { SecondaryUser } from "$lib/Firebase/firebase";

    let quarantineMemberForm: SuperValidated<typeof QuarantineMember>;
    
    export { quarantineMemberForm as form };

    export let member: SecondaryUser;

    export let disableSuccessMessage = false;

    let { form, enhance, reset, delayed, message } = superForm(quarantineMemberForm);

    let submit: HTMLButtonElement;
    let kicking: HTMLInputElement;

    let localLoading = getContext('localLoading') as Writable<boolean>;
    let warning = getContext('warning') as Writable<Warning | undefined>;

    $: $localLoading = $delayed;

    $: {
        if($message != undefined && (!disableSuccessMessage || $message != 'Member kicked.')) {
            warning.set({
                message: $message,
                color: $message == 'Member kicked.' ? 'green' : 'red',
            })

            $localLoading = false;
        }   
    }

    function handleKickMember() {
        kicking.value = member.id;

        submit.click();
    }

    onDestroy(() => {
        if($delayed == true) {
            warning.set({
                message: 'Member kicked.',
                color: $message == 'Member kicked.' ? 'green' : 'red',
            })

            $localLoading = false;
        }
    })
</script>

<form class="hidden" method=POST action=?/kick use:enhance>
    <input bind:this={kicking} name=id bind:value={$form.id}/>
    <button bind:this={submit}></button>
</form>

<slot {handleKickMember}/>

