<script lang=ts>
    import Background from "$lib/Builders/Background.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Page from "$lib/Builders/Page.svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import { getContext } from "svelte";

    let client = getContext('client') as ReturnType<typeof firebaseClient>;
</script>

<Background>
    <Page>
        <h1 class="text-2xl font-bold">Your Account</h1>
        <Line class="my-4 mt-2"></Line>
        <a href="/account/delete" class="flex p-8 py-4 gap-4 items-center rounded-lg bg-red-500 dark:bg-red-500 bg-opacity-10 dark:bg-opacity-5 hover:bg-opacity-20 dark:hover:bg-opacity-10 transition cursor-pointer text-red-900 dark:text-red-500">
            <Icon icon=delete scale=2.5rem></Icon>
            <div class="ml-4">
                <h2 class="mb-1 text-xl">Delete Your Account</h2>
                <h3 class="opacity-75">Delete your account, profile, and linked data. Learn what data specifically gets deleted.</h3>
            </div>
        </a>
    </Page>
</Background>