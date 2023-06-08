<script>
    import { loading } from "$lib/stores";
    import { client } from "./firebase";
</script>
<button on:click={() => { client.signIn(); }} class="w-full h-12 border-zinc-200 border-[1px] rounded-full mt-4 flex flex-row items-center justify-around dark:bg-white dark:border-zinc-700 shadow-sm dark:shadow-lg">
    <div class="flex flex-row items-center">
        <img class="h-10" alt="google logo" src="/google.svg"/>
        <h2 class="dark:text-zinc-700">Sign in with Google</h2>
    </div>
</button>