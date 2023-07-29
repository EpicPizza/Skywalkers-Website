<script lang=ts>
    import { createEventDispatcher, onMount } from "svelte";

    const dispatch = createEventDispatcher();

    onMount(() => {
        dispatch("delete");
    })
</script>