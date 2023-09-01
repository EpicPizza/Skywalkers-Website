<script lang=ts>
    import Dialog from "$lib/Builders/Dialog.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import DateInput from "$lib/Components/DateInput.svelte";

    export let open = false;
    import format from 'date-and-time';
    import meridiem from "date-and-time/plugin/meridiem";
    import { onMount } from "svelte";

    format.plugin(meridiem);

    let date = new Date();
    let start = new Date();
    let end = new Date();

    export let startTime: Date;
    export let endTime: Date;

    function reset() {
        start = new Date(startTime.valueOf());
        end = new Date(endTime.valueOf());
        date = new Date(startTime.valueOf());
    }

    function handleEndMinutes(e: Event) {
        const value = (e.target as any).value as string;

        const minutes = parseInt(value);

        if(isNaN(minutes)) return;

        if(minutes < 0) {
            end.setMinutes(0);
            end = end;
            return;
        }

        if(minutes > 59) {
            end.setMinutes(59);
            end = end;
            return;
        }


        end.setMinutes(minutes);

        end = end;
    }

    function handleStartMinutes(e: Event) {
        const value = (e.target as any).value as string;

        const minutes = parseInt(value);

        if(isNaN(minutes)) return;

        if(minutes < 0) {
            start.setMinutes(0);
            start = start;
            return;
        }

        if(minutes > 59) {
            start.setMinutes(59);
            start = start;
            return;
        }

        start.setMinutes(minutes);

        start = start;
    }

    function handleStartHours(e: Event) {
        const value = (e.target as any).value as string;

        let hours = parseInt(value);

        if(isNaN(hours)) return;

        if(hours < 1) hours = 1;
        if(hours > 12) hours = 12;

        const current = start.getHours() >= 12 ? 'pm' : 'am';

        if(current == 'pm') {
            start.setHours(hours + 12);
        } else if(current == 'am') {
            start.setHours(hours);
        }

        start = start;
    }

    function handleEndHours(e: Event) {
        console.log("handled");

        const value = (e.target as any).value as string;

        let hours = parseInt(value);

        if(isNaN(hours)) return;

        if(hours < 1) hours = 1;
        if(hours > 12) hours = 12;

        const current = end.getHours() >= 12 ? 'pm' : 'am';

        if(current == 'pm') {
            end.setHours(hours + 12);
        } else if(current == 'am') {
            end.setHours(hours);
        }

        end = end;
    }

    function submit() {
        let finalStart = new Date(start.valueOf());
        let finalEnd = new Date(end.valueOf());

        finalStart.setDate(date.getDate());
        finalStart.setMonth(date.getMonth());
        finalStart.setFullYear(date.getFullYear());

        finalEnd.setDate(date.getDate());
        finalEnd.setMonth(date.getMonth());
        finalEnd.setFullYear(date.getFullYear());

        open = !open;

        startTime = new Date(finalStart.valueOf());
        endTime = new Date(finalEnd.valueOf());
    }

    let dateInput: HTMLInputElement;
    let startHours: HTMLInputElement;
    let startMinutes: HTMLInputElement;
    let endHours: HTMLInputElement;
    let endMinutes: HTMLInputElement;
    let save: HTMLButtonElement;

    $: {
        if(!open) {
            reset();
        }
    }

    onMount(() => {
        reset();
    })
</script>

<Dialog bind:initialFocus={dateInput} bind:isOpen={open} width=22rem>
    <h1 class="text-2xl">Date Picker</h1>
    <Line class="my-4"></Line>
    <div class="flex items-center">
        <button on:click={() => { date.setDate(date.getDate() - 1); date = date; }} class="b-accent h-[38px] flex items-center justify-around mr-2"><Icon scale=1.5rem icon=arrow_back></Icon></button>
        <DateInput on:enter={() => { startHours.focus(); }} bind:element={dateInput} name=date class="p-2 py-1.5 rounded-md w-full" bind:date/>
        <button on:click={() => { date.setDate(date.getDate() + 1); date = date; }} class="b-accent h-[38px] flex items-center justify-around ml-2"><Icon scale=1.5rem icon=arrow_forward></Icon></button>
    </div>
    <p class="text-center py-1 opacity-75 italic">{format.format(date, "dddd, MMMM D")}</p>
    <div class="flex items-center mt-4 gap-2">
        <input bind:this={startHours} on:keypress={(e) => { if(e.key == 'Enter') { startMinutes.focus(); } }} value={start.getHours() >= 12 ? (start.getHours() - 12 == 0 ? '12' : start.getHours() - 12) : (start.getHours() == 0 ? '12' : start.getHours())} on:change={handleStartHours} class="w-[42px] p-2 py-1.5 rounded-md text-center" type="string"/>
        <p class="font-lg font-bold -mx-1">:</p>
        <input bind:this={startMinutes} on:keypress={(e) => { if(e.key == 'Enter') { endHours.focus(); } }} value={start.getMinutes() < 10 ? "0" + start.getMinutes() : start.getMinutes()} on:change={handleStartMinutes} class="w-[42px] p-2 py-1.5 rounded-md text-center" type="string"/>
        <button on:click={() => { start.setHours(start.getHours() >= 12 ? (start.getHours() - 12) : (start.getHours() + 12)); start = start; }} class="b-accent flex items-center justify-around w-[43px] h-[36px]">{start.getHours() >= 12 && start.getHours() != 24 ? "pm" : "am"}</button>
        <p class="font-lg font-bold">-</p>
        <input bind:this={endHours} on:keypress={(e) => { if(e.key == 'Enter') { endMinutes.focus(); } }} value={end.getHours() >= 12 ? (end.getHours() - 12 == 0 ? '12' : end.getHours() - 12)  : (end.getHours() == 0 ? '12' : end.getHours())} on:change={handleEndHours} class="w-[42px] p-2 py-1.5 rounded-md text-center" type="string"/>
        <p class="font-lg font-bold -mx-1">:</p>
        <input bind:this={endMinutes} on:keypress={(e) => { if(e.key == 'Enter') { save.focus(); } }} value={end.getMinutes() < 10 ? "0" + end.getMinutes() : end.getMinutes()} on:change={handleEndMinutes} class="w-[42px] p-2 py-1.5 rounded-md text-center" type="string"/>
        <button on:click={() => { end.setHours(end.getHours() >= 12 ? (end.getHours() - 12) : (end.getHours() + 12)); end = end; }} class="b-accent flex items-center justify-around w-[43px] h-[36px]">{end.getHours() >= 12 && end.getHours() != 24 ? "pm" : "am"}</button>
    </div>
    <p class="text-center pt-1 opacity-75 italic">{format.format(start, "h:mm a")} - {format.format(end, "h:mm a")}</p>
    <Line class="my-4"></Line>
    <div class="flex flex-row-reverse gap-2">
        <button bind:this={save} on:click={submit} class="b-green">Save</button>
        <button on:click={() => { open = !open; reset(); }} class="b-default">Cancel</button>
    </div>
</Dialog>