<script lang=ts>
    export let ordered: Boolean;
    export let start: number | null | undefined;
</script>
  
{#if ordered}
    <ol {start}><slot></slot></ol>
{:else}
    <ul><slot></slot></ul>
{/if}

<style lang="postcss">
    ol {
        @apply list-disc;
    }

    ul {
        @apply list-decimal;
    }
</style>