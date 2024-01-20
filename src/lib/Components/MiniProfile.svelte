<script lang="ts">
  import type { FirestoreUser, SecondaryUser } from "$lib/Firebase/firebase";
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";

  export let user: FirestoreUser | SecondaryUser | undefined;

  let team = getContext("team") as Writable<string>;
</script>

{#if user != undefined}
  {#if !("id" in user)}
    <div
      class="flex items-center w-fit bg-zinc-200 dark:bg-zinc-600 rounded-full p-1 pr-4"
    >
      <img
        referrerpolicy="no-referrer"
        class="inline-block h-7 w-7 lg:h-9 lg:w-9 rounded-full"
        alt="{user.displayName} Profile"
        src={user.photoURL}
      />
      <span class="text-lg ml-2 lg:text-xl"
        >{user.displayName}{user.pronouns
          ? " (" + user.pronouns + ")"
          : ""}</span
      >
    </div>
  {:else}
    <a
      href="/t/{$team}/settings/members/{user.id}"
      class="flex items-center w-fit bg-zinc-200 dark:bg-zinc-600 rounded-full p-1 pr-4"
    >
      <img
        referrerpolicy="no-referrer"
        class="inline-block h-7 w-7 lg:h-9 lg:w-9 rounded-full"
        alt="{user.displayName} Profile"
        src={user.photoURL}
      />
      <span class="text-lg ml-2 lg:text-xl"
        >{user.displayName}{user.pronouns
          ? " (" + user.pronouns + ")"
          : ""}</span
      >
    </a>
  {/if}
{:else}
  <div
    class="flex items-center w-fit bg-zinc-200 dark:bg-zinc-600 rounded-full px-4 h-9 lg:h-11"
  >
    <span class="text-lg lg:text-xl">User Not Found</span>
  </div>
{/if}
