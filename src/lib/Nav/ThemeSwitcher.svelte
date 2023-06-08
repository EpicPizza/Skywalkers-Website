<script lang="ts">
    import { onDestroy } from "svelte";
    import { mode } from "../stores";

    let system: boolean;

    const unsubscribe = mode.subscribeSystem((value) => {
    system = value;
    });

    onDestroy(() => {
        unsubscribe();
    })
</script>

<div class="box-content border-[1px] dark:border-zinc-700 border-slate-300 p-[4px] dark:text-white bg-white dark:bg-zinc-800 rounded-full max-w-fit flex flex-row gap-[4px]">
    <div class="flex flex-row gap-[4px] bg-slate-200 dark:bg-zinc-700 rounded-full">
        <button on:click={() => { system ? mode.set('light') : ($mode == 'dark' ? mode.set('light') : mode.set('dark')) }} class="box-border border-none rounded-full w-8 h-8 {$mode == 'dark' ? "bg-slate-200 dark:bg-zinc-700" : "bg-slate-300 dark:bg-zinc-600"} flex items-center justify-around"><span class="material-symbols-outlined">light_mode</span></button>
        <button on:click={() => { system ? mode.set('dark') : ($mode == 'light' ? mode.set('dark') : mode.set('light')) }} class="box-border border-none rounded-full w-8 h-8 {$mode == 'light' ? "bg-slate-200 dark:bg-zinc-700" : "bg-slate-300 dark:bg-zinc-600"} flex items-center justify-around"><span class="material-symbols-outlined">dark_mode</span></button>
    </div>
    <button  on:click={() => { system == false ? mode.reset() : mode.set(mode.getSystemTheme()) }} class="box-border border-none rounded-full w-8 h-8 {system ? 'bg-slate-300 dark:bg-zinc-600' : 'bg-slate-200 dark:bg-zinc-700'} flex items-center justify-around"><span class="material-symbols-outlined">settings_brightness</span></button>
</div>