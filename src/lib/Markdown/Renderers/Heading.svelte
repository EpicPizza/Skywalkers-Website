<script lang=ts>
    export let depth: number;
    export let raw: string;
    export let text: string;
    
    text; //to clear annoying warning
</script>

{#if depth === 1}
    <h1><slot></slot></h1>
{:else if depth === 2}
    <h2><slot></slot></h2>
{:else if depth === 3}
    <h3><slot></slot></h3>
{:else}
    {raw}
{/if}

<style lang="postcss">
    h1 {
        @apply text-2xl font-light mb-5 pb-2 border-b-[1px] border-b-border-light dark:border-b-border-dark;
    }

    h2 {
        @apply text-xl mb-5;
    }

    h3 {
        @apply text-lg mb-5 opacity-75;
    }
</style>