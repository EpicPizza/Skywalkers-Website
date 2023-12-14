<script lang=ts>
    export let ordered: Boolean;
    export let start: number | null | undefined;
</script>
  
{#if ordered}
    <ol {start} class="mb-4"><slot></slot></ol>
{:else}
    <ul class="mb-4"><slot></slot></ul>
{/if}

<style lang="postcss">
    ol {
        @apply list-decimal;
    }

    ul {
        @apply list-disc;
    }
</style>