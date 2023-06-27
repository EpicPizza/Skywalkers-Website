<script lang=ts>
    import Background from "$lib/Builders/Background.svelte";
    import Page from "$lib/Builders/Page.svelte";
</script>

<svelte:head>
    <title>Skywalkers | Verify</title>
</svelte:head>

<Background>
    <Page>
        <slot></slot>
    </Page>
</Background>