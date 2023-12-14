<script lang=ts>
    import type { createMode } from "$lib/stores";
    import { getContext } from "svelte";

    let mode = getContext('mode') as ReturnType<typeof createMode>;

    let bottom = "1rem";
</script>

<div style="padding-bottom: {bottom}; padding-top: {bottom};" class="px-4 h-[calc(100svh)] w-full bg-white dark:bg-zinc-800 bg-opacity-70 pattern">
    <div class="flex flex-col mt-20 justify-around items-center h-[calc(100svh-7.75rem)] w-full">
        <slot></slot>
    </div>
</div>