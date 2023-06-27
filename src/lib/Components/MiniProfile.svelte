<script lang=ts>
    import type { FirestoreUser } from "$lib/Firebase/firebase";

    export let user: FirestoreUser | undefined;
</script>

{#if user != undefined}
    <div class="flex items-center bg-zinc-200 dark:bg-zinc-600 rounded-full p-1 pr-4">
        <img referrerpolicy="no-referrer"  class="inline-block h-7 w-7 rounded-full" alt="{user.displayName} Profile" src={user.photoURL}>
        <span class="text-lg ml-2">{user.displayName}</span>
    </div>
{:else}
    <div class="flex items-center bg-zinc-200 dark:bg-zinc-600 rounded-full px-4 h-9">
        <span class="text-lg">User Not Found</span>
    </div>
{/if}