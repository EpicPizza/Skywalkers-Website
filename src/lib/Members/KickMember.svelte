<script lang="ts">
  import type { Warning } from "$lib/stores";
  import { getContext, onDestroy } from "svelte";
  import type { Writable } from "svelte/store";
  import { superForm } from "sveltekit-superforms/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { QuarantineMember } from "./members";
  import type { SecondaryUser } from "$lib/Firebase/firebase";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  let quarantineMemberForm: SuperValidated<typeof QuarantineMember>;

  export { quarantineMemberForm as form };

  let team = getContext("team") as Writable<string>;

  export let member: SecondaryUser | string;

  export let disableSuccessMessage = false;

  let { form, enhance, reset, delayed, message, submitting } =
    superForm(quarantineMemberForm);

  let submit: HTMLButtonElement;
  let kicking: HTMLInputElement;

  let localLoading = getContext("localLoading") as Writable<boolean>;
  let warning = getContext("warning") as Writable<Warning | undefined>;
  let leaving = getContext("leaving") as Writable<boolean>;

  export let isKicking = true;

  $: $localLoading = $delayed;

  $: {
    if (
      $message != undefined &&
      (!disableSuccessMessage ||
        $message != "Member kicked." ||
        $message == "Removed from team.")
    ) {
      warning.set({
        message: $message,
        color:
          $message == "Member kicked." || $message == "Removed from team."
            ? "green"
            : "red",
      });

      $leaving = false;

      $localLoading = false;
    }
  }

  function handleKickMember() {
    kicking.value = typeof member == "object" ? member.id : member;

    if (!isKicking) {
      $leaving = true;
    }

    submit.click();
  }

  onDestroy(() => {
    if ($submitting == true) {
      if (isKicking) {
        warning.set({
          message: "Member kicked",
          color: "red",
        });

        $localLoading = false;
      }
    }
  });
</script>

<form class="hidden" method="POST" action="?/kick" use:enhance>
  <input bind:this={kicking} name="id" bind:value={$form.id} />
  <button bind:this={submit}></button>
</form>

<slot {handleKickMember} />
