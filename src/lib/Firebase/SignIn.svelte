<script lang=ts>
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import type { firebaseClient } from "./firebase";

    let loading = getContext('loading') as Writable<boolean>;

    let client = getContext('client') as ReturnType<typeof firebaseClient>;
</script>
<button on:click={() => { client.signIn(); }} class="w-full h-12 border-zinc-200 border-[1px] rounded-full mt-4 flex flex-row items-center justify-around dark:bg-white dark:border-zinc-700">
    <div class="flex flex-row items-center select-none">
        <img class="h-10" alt="google logo" src="/google.svg"/>
        <h2 class="dark:text-zinc-700 text-lg ml-1">Sign in with Google</h2>
    </div>
</button>