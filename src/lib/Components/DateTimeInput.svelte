<script lang=ts>
    import format from 'date-and-time';
    import { onMount } from 'svelte';

    export {style as class};
    export let date: Date;
    export let name: string;

    let stringdate: string;
    let style = "";

    $: date = trytoparse(stringdate);

    let trytoparse = (input: string): Date => {
        if(stringdate != null && stringdate != undefined && stringdate != '') {
            return format.parse(input, "YYYY-MM-DDTHH:mm");   
        } else {
            return date;
        }
    }

    onMount(() => {
        if(date) {
            stringdate = format.format(date, "YYYY-MM-DDTHH:mm");
        }
    });
</script>

<input name={name} type="datetime-local" bind:value={stringdate} class={style}/>