<script lang=ts>
    import DatePicker from "$lib/Builders/DatePicker.svelte";
    import Icon from "$lib/Builders/Icon.svelte";

    let open = false;

    let start = new Date();
    let end = new Date();
</script>

<DatePicker bind:startTime={start} bind:endTime={end} bind:open></DatePicker>

<div class="p-20">
    <button on:click={() => { open = !open; }} class="b-accent w-10 h-10 flex space-between justify-around m-20">
        <Icon class="translate-y-0.5" icon=event></Icon>
    </button>
</div>