<script lang=ts>
    import format from 'date-and-time';
    import { onMount } from 'svelte';
    import type { Unsubscriber, Writable } from 'svelte/store';
    import { onDestroy } from 'svelte';
    import { createEventDispatcher } from 'svelte/types/runtime/internal/lifecycle';

    export {style as class};
    export let date: Date;
    export let name: string;

    let stringdate: string;
    let style = "";

    let dispatch = createEventDispatcher();

    $: date = trytoparse(stringdate);

    let trytoparse = (input: string): Date => {
        if(stringdate != null && stringdate != undefined && stringdate != '') {
            return format.parse(input, "YYYY-MM-DDTHH:mm");   
        } else {
            return date;
        }
    }

    let unsubscribe: Unsubscriber | undefined;

    onMount(() => {
        if(date) {
            stringdate = format.format(date, "YYYY-MM-DDTHH:mm");
        }
    });

    onDestroy(() => {
        if(unsubscribe) unsubscribe();
    })
</script>

<input on:keypress={(e) => { if(e.key == 'Enter') { dispatch("enter") } }} name={name} type="datetime-local" bind:value={stringdate} class={style}/>