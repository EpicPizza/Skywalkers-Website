<script lang=ts>
    import { loading, localLoading } from "$lib/stores";
    import Loading from "./Loading.svelte";
</script>
<div class="bg-backgroud-light dark:bg-backgroud-dark border-border-light dark:border-border-dark shadow-sm dark:shadow-lg border-[1px] max-w-lg rounded-2xl max-h-full overflow-auto">
    <div class="h-full overflow-y-auto p-8">
        {#if $loading}
            <Loading></Loading>
        {:else}
            <slot></slot>
        {/if}
    </div>
    {#if $localLoading}
        <div class="absolute top-8 right-8">
            <Loading></Loading>
        </div>
    {/if}
</div>