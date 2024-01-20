<script lang="ts">
  import Background from "$lib/Builders/Background.svelte";
  import Page from "$lib/Builders/Page.svelte";
</script>

<Background>
  <Page size="24rem" expand>
    <slot />
  </Page>
</Background>
