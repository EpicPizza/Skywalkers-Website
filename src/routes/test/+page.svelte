<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import DateTimeInput from "$lib/Components/DateTimeInput.svelte";
    import TimeInput from "$lib/Components/TimeInput.svelte";

    let time = new Date();
</script>

<div class="p-8">
    <div class="bg-secondary-light dark:bg-secondary-dark p-1.5 rounded-lg w-fit flex items-center">
        <button class="b-primary mr-1 h-[28px] sm:w-[32px] w-[28px] sm:h-[32px] flex justify-around items-center"><Icon icon=arrow_back scale=1.25rem></Icon></button>
        <input class="relative rounded-md w-[88px] sm:w-[104px] py-0.5 text-sm sm:text-base text-center bg-transparent dark:bg-transparent" type=date/>
        <button class="b-primary ml-1 h-[28px] sm:w-[32px] w-[28px] sm:h-[32px] flex justify-around items-center"><Icon icon=arrow_forward scale=1.25rem></Icon></button>
        <input class="py-0.5 px-0.5 text-sm sm:text-base rounded-lg w-6 sm:w-7 bg-transparent dark:bg-transparent text-right" type=number value=1/>
        <p class="text-sm sm:text-base">:</p>
        <input class="py-0.5 px-0.5 text-sm sm:text-base rounded-lg w-6 sm:w-7 bg-transparent dark:bg-transparent text-left" type=number value=12/>
        <button class="text-sm sm:text-base">pm</button>
        <p class="pl-1 -mr-1 text-sm sm:text-base">-</p>
        <input class="py-0.5 px-0.5 text-sm sm:text-base rounded-lg w-6 sm:w-7 bg-transparent dark:bg-transparent text-right" type=number value=12/>
        <p class="text-sm sm:text-base">:</p>
        <input class="py-0.5 px-0.5 text-sm sm:text-base rounded-lg w-6 sm:w-7 bg-transparent dark:bg-transparent text-left" type=number value=12/>
        <button class="mr-1 text-sm sm:text-base">pm</button>
    </div>
    <div class="flex items-center mt-4">
        <DateTimeInput name=time bind:date={time} class="w-[215px] min-w-[215px] rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"/>
        <p class="mx-1"> - </p>
        <TimeInput name=time bind:date={time} class="w-[120px] min-w-[120px] rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"/>
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