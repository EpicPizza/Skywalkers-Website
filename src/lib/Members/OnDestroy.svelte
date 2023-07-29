<script lang=ts>
    import { getContext, onDestroy } from "svelte";
    import type { Writable } from "svelte/store";

    let localLoading = getContext('localLoading') as Writable<boolean>;

    onDestroy(() => {
        $localLoading = false;
    })
</script>