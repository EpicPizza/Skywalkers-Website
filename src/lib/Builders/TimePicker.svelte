<script lang=ts>
    export let open = false;
    import format from 'date-and-time';
    import meridiem from "date-and-time/plugin/meridiem";
    import { onMount } from "svelte";

    format.plugin(meridiem);

    export let start = new Date();
    export let end = new Date();

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

    let startHours: HTMLInputElement;
    let startMinutes: HTMLInputElement;
    let endHours: HTMLInputElement;
    let endMinutes: HTMLInputElement;
    let save: HTMLButtonElement;
</script>

<div class="flex items-center gap-2 flex-row">
    <div class="flex items-center gap-2">
        <input bind:this={startHours} on:keypress={(e) => { if(e.key == 'Enter') { startMinutes.focus(); } }} value={start.getHours() >= 12 ? (start.getHours() - 12 == 0 ? '12' : start.getHours() - 12) : (start.getHours() == 0 ? '12' : start.getHours())} on:change={handleStartHours} class="min-w-[38px] w-full h-[32px] lg:h-[36px] p-2 py-1.5 rounded-md text-center lg:text-lg" type="string"/>
        <p class="text-lg font-bold -mx-1 lg:text-lg">:</p>
        <input bind:this={startMinutes} on:keypress={(e) => { if(e.key == 'Enter') { endHours.focus(); } }} value={start.getMinutes() < 10 ? "0" + start.getMinutes() : start.getMinutes()} on:change={handleStartMinutes} class="min-w-[38px] w-full h-[32px] lg:h-[36px] lg:text-lg p-2 py-1.5 rounded-md text-center" type="string"/>
        <button on:click|preventDefault={() => { start.setHours(start.getHours() >= 12 ? (start.getHours() - 12) : (start.getHours() + 12)); start = start; }} class="b-accent flex items-center justify-around w-[43px] lg:h-[36px] h-[32px] lg:text-lg">{start.getHours() >= 12 && start.getHours() != 24 ? "pm" : "am"}</button>
    </div>
    <p class="font-lg font-bold">-</p>
    <div class="flex items-center gap-2">
        <input bind:this={endHours} on:keypress={(e) => { if(e.key == 'Enter') { endMinutes.focus(); } }} value={end.getHours() >= 12 ? (end.getHours() - 12 == 0 ? '12' : end.getHours() - 12)  : (end.getHours() == 0 ? '12' : end.getHours())} on:change={handleEndHours} class="min-w-[38px] w-full h-[32px] lg:h-[36px] lg:text-lg p-2 py-1.5 rounded-md text-center" type="string"/>
        <p class="text-base font-bold -mx-1 lg:text-lg">:</p>
        <input bind:this={endMinutes} on:keypress={(e) => { if(e.key == 'Enter') { save.focus(); } }} value={end.getMinutes() < 10 ? "0" + end.getMinutes() : end.getMinutes()} on:change={handleEndMinutes} class="min-w-[38px] w-full h-[32px] lg:h-[36px] lg:text-lg p-2 py-1.5 rounded-md text-center" type="string"/>
        <button on:click|preventDefault={() => { end.setHours(end.getHours() >= 12 ? (end.getHours() - 12) : (end.getHours() + 12)); end = end; }} class="b-accent flex items-center justify-around w-[43px] h-[32px] lg:h-[36px] lg:text-lg">{end.getHours() >= 12 && end.getHours() != 24 ? "pm" : "am"}</button>
    </div>
</div>