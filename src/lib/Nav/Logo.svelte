<script lang="ts">
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";
  import { page } from "$app/stores";
  import type { createCurrentTeam } from "$lib/stores";

  let global = getContext("global") as Writable<boolean>;
  let teamInfo = getContext("teamInfo") as Writable<
    Map<string, { name: string; website: string; icon: string }>
  >;
  let currentTeam = getContext("currentTeam") as ReturnType<
    typeof createCurrentTeam
  >;

  $: info = $teamInfo.get(
    $page.params.team == undefined
      ? $currentTeam
        ? $currentTeam.team
        : "000000"
      : $page.params.team,
  );
</script>

{#if info}
  <a
    href="{!$global && ($page.params.team || $currentTeam)
      ? '/t/' +
        ($page.params.team == undefined
          ? $currentTeam
            ? $currentTeam.team
            : '000000'
          : $page.params.team)
      : ''}/"
    ><img
      alt="logo"
      src={$global ? "/favicon.webp" : info.icon}
      class="max-h-[3rem] max-w-[3rem] rounded-lg"
    /></a
  >
{:else}
  <a
    href="{!$global && ($page.params.team || $currentTeam)
      ? '/t/' +
        ($page.params.team == undefined
          ? $currentTeam
            ? $currentTeam.team
            : '000000'
          : $page.params.team)
      : ''}/"
    ><img
      alt="logo"
      src="/favicon.webp"
      class="max-h-[3rem] max-w-[3rem] rounded-lg"
    /></a
  >
{/if}
