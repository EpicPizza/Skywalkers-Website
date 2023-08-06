<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import DateTimeInput from "$lib/Components/DateTimeInput.svelte";
    import TimeInput from "$lib/Components/TimeInput.svelte";
    import { onMount } from "svelte";
    import format from 'date-and-time';

    let date: HTMLInputElement;

    onMount(() => {
        date.valueAsDate = new Date();
    })

    function add() {
        let value = date.valueAsDate;

        if(value == undefined) value = new Date();

        value.setDate(value.getDate() + 1);

        date.valueAsDate = value;
    }

    function remove() {
        let value = date.valueAsDate;

        if(value == undefined) value = new Date();

        value.setDate(value.getDate() - 1);

        date.valueAsDate = value;
    }

    let starthour = 1;
    let startmin: number = 12;
    let starthalf = "am";

    let endhour = 12;
    let endmin = 12;
    let endhalf = "am";

    $: startminvisible = startmin < 10 ? "0" + startmin : startmin + "";

    $: endminvisible = endmin < 10 ? "0" + endmin : endmin + "";
</script>

<div class="p-8">
    <div class="bg-secondary-light dark:bg-secondary-dark p-1.5 rounded-lg w-fit flex items-center h-[38px] sm:h-[44px]">
        <button on:click={remove} class="b-primary mr-1 h-[28px] sm:w-[32px] w-[28px] sm:h-[32px] flex justify-around items-center"><Icon icon=arrow_back scale=1.25rem></Icon></button>
        <input bind:this={date} class="relative rounded-md w-[88px] sm:w-[104px] py-0.5 text-sm sm:text-base text-center bg-transparent dark:bg-transparent" type=date/>
        <button on:click={add} class="b-primary ml-1 h-[28px] sm:w-[32px] w-[28px] sm:h-[32px] flex justify-around items-center"><Icon icon=arrow_forward scale=1.25rem></Icon></button>
        <div class="flex-col group items-center w-6 sm:w-7 ml-1">
            <button disabled={starthour == 12} on:click={() => { starthour = Math.round(starthour); if(starthour >= 12) { starthour = 12; } else { starthour++; } }} class="b-primary w-6 hidden sm:w-7 group-hover:flex group-focus-within:flex justify-around items-center absolute -translate-y-[26px] z-10 disabled:opacity-50"><Icon icon=add scale=1rem></Icon></button>
            <input class="py-0.5 px-0.5 text-sm sm:text-base rounded-lg w-6 sm:w-7 bg-transparent dark:bg-transparent text-right" type=number bind:value={starthour}/>
            <button disabled={starthour == 1} on:click={() => { starthour = Math.round(starthour); if(starthour <= 1) { starthour = 1; } else { starthour--; } }} class="b-primary w-6 hidden sm:w-7 group-hover:flex group-focus-within:flex justify-around items-center absolute z-10 disabled:opacity-50"><Icon icon=remove scale=1rem></Icon></button>
        </div>
        <p class="text-sm sm:text-base">:</p>
        <div class="flex-col group items-center w-6 sm:w-7">
            <button disabled={startmin == 59} on:click={() => { startmin = Math.round(startmin); if(startmin >= 59) { startmin = 59; } else { startmin++; }}} class="b-primary w-6 hidden sm:w-7 group-hover:flex group-focus-within:flex justify-around items-center absolute -translate-y-[26px] z-10"><Icon icon=add scale=1rem></Icon></button>
            <input on:change={() => { if(!isNaN(parseInt(startminvisible))) { startmin = parseInt(startminvisible); } }} class="py-0.5 px-0.5 text-sm sm:text-base rounded-lg w-6 sm:w-7 bg-transparent dark:bg-transparent text-left" type=number bind:value={startminvisible}/>
            <button disabled={startmin == 1} on:click={() => { startmin = Math.round(startmin); if(startmin <= 1) { startmin = 1; } else { startmin--; } }} class="b-primary w-6 hidden sm:w-7 group-hover:flex group-focus-within:flex justify-around items-center absolute z-10"><Icon icon=remove scale=1rem></Icon></button>
        </div>
        <div class="flex-col group items-center w-6 sm:w-7">
            <button class="b-primary w-5 hidden sm:w-6 group-hover:flex group-focus-within:flex justify-around items-center absolute -translate-y-[28px] h-[28px] z-10">am</button>
            <button class="text-sm sm:text-base">pm</button>
            <button class="b-primary  w-5 hidden sm:w-6 justify-around items-center absolute z-10"><Icon icon=remove scale=1rem></Icon></button>
        </div>
        <p class="pl-1 -mr-1 text-sm sm:text-base">-</p>
        <div class="flex-col group items-center w-6 sm:w-7">
            <button disabled={endhour == 12} on:click={() => { endhour = Math.round(endhour); if(endhour >= 12) { endhour = 12; } else { endhour++; } }} class="b-primary w-6 hidden sm:w-7 group-hover:flex group-focus-within:flex justify-around items-center absolute -translate-y-[26px] z-10 disabled:opacity-50"><Icon icon=add scale=1rem></Icon></button>
            <input class="py-0.5 px-0.5 text-sm sm:text-base rounded-lg w-6 sm:w-7 bg-transparent dark:bg-transparent text-right" type=number bind:value={endhour}/>
            <button disabled={endhour == 1} on:click={() => { endhour = Math.round(endhour); if(endhour <= 1) { endhour = 1; } else { endhour--; } }} class="b-primary w-6 hidden sm:w-7 group-hover:flex group-focus-within:flex justify-around items-center absolute z-10 disabled:opacity-50"><Icon icon=remove scale=1rem></Icon></button>
        </div>
        <p class="text-sm sm:text-base">:</p>
        <div class="flex-col group items-center w-6 sm:w-7">
            <button disabled={endmin == 59} on:click={() => { endmin = Math.round(endmin); if(endmin >= 59) { endmin = 59; } else { endmin++; }}} class="b-primary w-6 hidden sm:w-7 group-hover:flex group-focus-within:flex justify-around items-center absolute -translate-y-[26px] z-10"><Icon icon=add scale=1rem></Icon></button>
            <input on:change={() => { if(!isNaN(parseInt(endminvisible))) { endmin = parseInt(endminvisible); } }} class="py-0.5 px-0.5 text-sm sm:text-base rounded-lg w-6 sm:w-7 bg-transparent dark:bg-transparent text-left" type=number bind:value={endminvisible}/>
            <button disabled={endmin == 1} on:click={() => { endmin = Math.round(endmin); if(endmin <= 1) { endmin = 1; } else { endmin--; } }} class="b-primary w-6 hidden sm:w-7 group-hover:flex group-focus-within:flex justify-around items-center absolute z-10"><Icon icon=remove scale=1rem></Icon></button>
        </div>
        <div class="flex-col group items-center w-6 sm:w-7">
            <button class="b-primary w-5 hidden sm:w-6 justify-around items-center absolute -translate-y-[28px] h-[28px] z-10">am</button>
            <button class="text-sm sm:text-base">am</button>
            <button class="b-primary w-5 hidden sm:w-6 group-hover:flex group-focus-within:flex justify-around items-center absolute h-[28px] z-10">pm</button>
        </div>
    </div>
</div>

<style>
    input[type="date"]::-webkit-calendar-picker-indicator,
    input[type="date"]::-webkit-inner-spin-button {
        background: transparent;
        bottom: 0;
        color: transparent;
        cursor: pointer;
        height: auto;
        left: 0;
        position: absolute;
        right: 0;
        top: 0;
        opacity: 0;
        -webkit-appearance: none;
        display: none;
        width: auto;
    }

    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
</style>