<script lang="ts">
  import Loading from "$lib/Builders/Loading.svelte";
  import type { firebaseClient } from "$lib/Firebase/firebase";
  import Icon from "$lib/Builders/Icon.svelte";
  import { getContext, onDestroy, onMount } from "svelte";
  import { superForm } from "sveltekit-superforms/client";
  import { goto, invalidateAll } from "$app/navigation";
  import type { Writable } from "svelte/store";
  import type { Warning } from "$lib/stores.js";
  import Link from "$lib/Builders/Link.svelte";

  let client = getContext("client") as ReturnType<typeof firebaseClient>;

  let warning = getContext("warning") as Writable<Warning | undefined>;
  let localLoading = getContext("localLoading") as Writable<boolean>;
  let loading = getContext("loading") as Writable<boolean>;
  let teamInfo = getContext("teamInfo") as Writable<
    Map<string, { name: string; website: string; icon: string }>
  >;

  $: info = $teamInfo.get(data.unverifiedTeam);

  export let data;

  if (data.verify.errors.invalid) {
    warning.set({
      color: "red",
      message: "An unexpected error occurred",
    });
  }

  if (data.verify.errors.redirected) {
    warning.set({
      color: "yellow",
      message: "Verify to access",
    });
  }

  onDestroy(() => {
    $localLoading = false;
  });

  onMount(() => {
    $loading = false;

    if (data.verify.errors.invalid) {
      $localLoading = false;
    }
  });
</script>

{#if $client == undefined}
  <Loading></Loading>
{:else}
  <h1 class="text-3xl text-center font-light">
    {info?.name ?? "Skywalkers"} Team Website
  </h1>
  <p class="mt-4 text-center">
    You need to be invited to access this team website. If you have already been
    invited, look in your email for an invite link.
  </p>
{/if}
