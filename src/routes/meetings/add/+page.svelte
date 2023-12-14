<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Loading from "$lib/Builders/Loading.svelte";
    import IconChooser from "$lib/Components/IconChooser.svelte";
    import PersonChooser from "$lib/Components/PersonChooser.svelte";
    import { superForm } from "sveltekit-superforms/client";
    import Error from "$lib/Builders/Error.svelte";
    import RoleInput from "$lib/Components/RoleInput.svelte";
    import format from "date-and-time";
    import meridiem from 'date-and-time/plugin/meridiem';
    import DatePicker from "$lib/Builders/DatePicker.svelte";
    import { createTabs, melt } from '@melt-ui/svelte';
    import { cubicInOut } from 'svelte/easing';
    import { crossfade, slide } from 'svelte/transition';
    import Combobox from "$lib/Builders/Combobox.svelte";
    import TimePicker from "$lib/Builders/TimePicker.svelte";

    format.plugin(meridiem);

    const {
        elements: { root, list, content, trigger },
        states: { value },
    } = createTabs({
        defaultValue: 'tab-1',
    });

    const triggers = [
        { id: 'tab-1', title: 'One Time' },
        { id: 'tab-2', title: 'Recurring'},
    ];

    const [send, receive] = crossfade({
        duration: 250,
        easing: cubicInOut,
    });

    export let data;
    
    const onetime = superForm(data.forms.onetime, {
        clearOnSubmit: 'errors-and-message',
        delayMs: 500,
        timeoutMs: 8000,
        dataType: 'json',
    });

    let onetimeTainted = onetime.tainted;
    let onetimeEnhance = onetime.enhance;
    let onetimeForm = onetime.form;
    let onetimeErrors = onetime.allErrors;
    let onetimeMessage = onetime.message;
    let onetimeDelayed = onetime.delayed;

    const recurring = superForm(data.forms.recurring, {
        clearOnSubmit: 'errors-and-message',
        delayMs: 500,
        timeoutMs: 8000,
        dataType: 'json',
    });

    let recurringTainted = recurring.tainted;
    let recurringEnhance = recurring.enhance;
    let recurringForm = recurring.form;
    let recurringErrors = recurring.allErrors;
    let recurringMessage = recurring.message;
    let recurringDelayed = recurring.delayed;

    let setStarts = false;
    let setEnds = false;

    $: {
        if($onetimeTainted != undefined && $onetimeTainted.starts == true && setStarts == false) {
            $onetimeTainted.starts = false;
            setStarts = true;
        }
    }

    $: {
        if($onetimeTainted != undefined && $onetimeTainted.ends == true && setEnds == false) {
            $onetimeTainted.ends = false;
            setEnds = true;
        }
    }

    $: {
        if($onetimeTainted != undefined && $onetimeTainted.starts == true && setStarts == false) {
            $onetimeTainted.starts = false;
            setStarts = true;
        }
    }

    $: {
        if($onetimeTainted != undefined && $onetimeTainted.ends == true && setEnds == false) {
            $onetimeTainted.ends = false;
            setEnds = true;
        }
    }

    let open = false;

    let dayList = [
        {
            id: "Monday",
            disabled: false,
            detail: {
                name: "Monday",
            }
        },
        {
            id: "Tuesday",
            disabled: false,
            detail: {
                name: "Tuesday",
            }
        },
        {
            id: "Wednesday",
            disabled: false,
            detail: {
                name: "Wednesday",
            }
        },
        {
            id: "Thrusday",
            disabled: false,
            detail: {
                name: "Thursday",
            }
        },
        {
            id: "Friday",
            disabled: false,
            detail: {
                name: "Friday",
            }
        },
        {
            id: "Saturday",
            disabled: false,
            detail: {
                name: "Saturday",
            }
        },
        {
            id: "Sunday",
            disabled: false,
            detail: {
                name: "Sunday",
            }
        }
    ]

    let recurringList = [
        {
            id: "Weekly",
            disabled: false,
            detail: {
                name: "Weekly",
            }
        },
        {
            id: "Biweekly",
            disabled: false,
            detail: {
                name: "Biweekly",
            }
        },
        {
            id: "Monthly",
            disabled: false,
            detail: {
                name: "Monthly",
            }
        }
    ]

    let weekList = [
        {
            id: "First Week of the Month",
            disabled: false,
            detail: {
                name: "First Week"
            }
        },
        {
            id: "Second Week of the Month",
            disabled: false,
            detail: {
                name: "Second Week"
            }
        },
        {
            id: "Third Week of the Month",
            disabled: false,
            detail: {
                name: "Third Week"
            }
        },
        {
            id: "Fourth Week of the Month",
            disabled: false,
            detail: {
                name: "Fourth Week"
            }
        }
    ]

    $: {
        if($recurringForm.recurring != "Monthly") {
            $recurringForm.week == "First Week of the Month";
        }
    }
</script>


<svelte:head>
    <title>Skywalkers | Add Meeting</title>
</svelte:head>

<div class="min-h-[calc(100dvh)] p-8 pt-[88px] flex justify-around">
    <div class="w-[36rem] lg:w-[44rem]">
        <div class="w-full flex justify-between">
            <button on:click={() => { history.back() }} class="flex gap-1 p-1 mb-2 pr-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition lg:text-lg">
                <Icon scale={0} class="text-[1.25rem] w-[1.25rem] h-[1.25rem] lg:text-[1.5rem] lg:w-[1.5rem] lg:h-[1.5rem]" icon=arrow_back></Icon>
                <p>Back</p>
            </button>
            <button on:click={() => {
                $onetimeTainted = undefined;
                $recurringTainted = undefined;

                history.back();
            }} class="flex gap-1 p-1 mb-2 pr-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition lg:text-lg">
                <Icon scale={0} class="text-[1.25rem] w-[1.25rem] h-[1.25rem] lg:text-[1.5rem] lg:w-[1.5rem] lg:h-[1.5rem]" icon=cancel></Icon>
                <p>Cancel</p>
            </button>
        </div>
        <Line class="mb-6"></Line>
        <!--
        <div class="w-full h-11 flex">
            {#each triggers as triggerItem}
                <button use:melt={$trigger(triggerItem.id)} class="w-full relative bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-5 dark:hover:bg-opacity-5 transition">
                    {triggerItem.title}
                    {#if $value === triggerItem.id}
                        <div
                            in:send={{ key: 'trigger' }}
                            out:receive={{ key: 'trigger' }}
                            class="absolute bottom-0 left-1/2 h-1 w-16 -translate-x-1/2 rounded-t-lg bg-accent-500"
                        />
                    {/if}
                </button>
            {/each}
        </div>
        <Line class="mb-4"></Line>
        -->
        <div use:melt={$content('tab-1')}>
            <h1 class="text-2xl lg:text-3xl pb-4">Add Meeting:</h1>
            <form method="POST" action="?/onetime" use:onetimeEnhance>
                <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
                    <p class="text-lg lg:text-xl">Title:</p>
                    <input name=name bind:value={$onetimeForm.name} class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"/>
                </div>
                <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
                    <p class="text-lg lg:text-xl">Location:</p>
                    <input name=location bind:value={$onetimeForm.location} class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700 {$onetimeForm.location == "Google Meet Link Insert" ? "italic text-opacity-80" : ""}"/>
                    <button class="-ml-[1.5rem] -translate-x-[0.3rem]" on:click={(e) => { e.preventDefault(); $onetimeForm.location = 'Google Meet Link Insert'; $onetimeForm.virtual = true; }}>
                        <Icon scale=1.25rem icon=videocam></Icon>
                    </button>
                </div>
                <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
                    <DatePicker bind:startTime={$onetimeForm.starts} bind:endTime={$onetimeForm.ends} bind:open/>
                    <p class="text-lg lg:text-xl">When:</p>
                    <p class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700">{format.format($onetimeForm.starts, "ddd, MMM DD")}: {format.format($onetimeForm.starts, "h:mm a")} - {format.format($onetimeForm.ends, "h:mm a")}</p>
                    <button class="-ml-[1.5rem] -translate-x-[0.3rem]" on:click={(e) => { e.preventDefault(); open = true; }}>
                        <Icon scale=1.25rem icon=schedule></Icon>
                    </button>                
                </div>
                <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
                    <p class="text-lg lg:text-xl">Thumbnail:</p>
                    <IconChooser name=thumbnail bind:value={$onetimeForm.thumbnail} class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700 text-left"></IconChooser>
                </div>
                <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
                    <p class="text-lg lg:text-xl">Lead:</p>
                    <PersonChooser name=lead bind:value={$onetimeForm.lead} class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700 text-left"></PersonChooser>
                </div>
                <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
                    <p class="text-lg lg:text-xl">Mentor:</p>
                    <PersonChooser optional name=mentor bind:value={$onetimeForm.mentor} class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700 text-left"></PersonChooser>
                </div>
                <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
                    <p class="text-lg lg:text-xl">Synopsis:</p>
                    <PersonChooser optional name=synopsis bind:value={$onetimeForm.synopsis} class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700 text-left"></PersonChooser>
                </div>
                <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
                    <p class="text-lg lg:text-xl">Group:</p>
                    <RoleInput optional roles={data.roles} name=role bind:value={$onetimeForm.role} class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"/>
                </div>
                <input hidden name=virtual type="checkbox" bind:checked={$onetimeForm.virtual}/>
                <div class="flex gap-2 mt-6 items-center lg:gap-3">
                    <button on:click|preventDefault={() => { $onetimeForm.virtual = !$onetimeForm.virtual }} class="p-1 {$onetimeForm.virtual ? "border-blue-700 dark:border-blue-500 bg-blue-200 dark:bg-blue-900 text-blue-700 dark:text-blue-500" : "border-border-light dark:border-border-dark text-border-light dark:text-border-dark"} border-[1px] rounded-md m-0.5 transition disabled:cursor-not-allowed disabled:opacity-40">
                        <Icon icon=check></Icon>
                    </button>
                    <p class="text-lg">Create a Google Meet link.</p>
                </div>
                <Error allErrors={onetimeErrors} message={onetimeMessage}></Error>
                <div class="flex items-center mt-6 gap-4">
                    <button class="b-primary lg:p-1 lg:px-2 lg:text-lg flex items-center gap-1">
                        <Icon scale=1.25rem icon=save></Icon>
                        <p class="text-inherit">Save</p>
                    </button>
                    {#if $onetimeDelayed}
                        <Loading></Loading>
                    {/if}
                </div>
            </form>
        </div>
        <div use:melt={$content('tab-2')}>
            <h1 class="text-2xl lg:text-3xl pb-4">Add Meeting:</h1>
            <form action="?/recurring" method="POST">
                <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
                    <p class="text-lg lg:text-xl">Title:</p>
                    <input name=name bind:value={$recurringForm.name} class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"/>
                </div>
                <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
                    <p class="text-lg lg:text-xl">Location:</p>
                    <input name=location bind:value={$recurringForm.location} class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700 {$recurringForm.location == "Google Meet Link Insert" ? "italic text-opacity-80" : ""}"/>
                    <button class="-ml-[1.5rem] -translate-x-[0.3rem]" on:click={(e) => { e.preventDefault(); $recurringForm.location = 'Google Meet Link Insert'; $recurringForm.virtual = true; }}>
                        <Icon scale=1.25rem icon=videocam></Icon>
                    </button>
                </div>
                <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
                    <p class="text-lg lg:text-xl">Thumbnail:</p>
                    <IconChooser name=thumbnail bind:value={$recurringForm.thumbnail} class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700 text-left"></IconChooser>
                </div>
                <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
                    <p class="text-lg lg:text-xl">Group:</p>
                    <RoleInput optional roles={data.roles} name=role bind:value={$recurringForm.role} class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"/>
                </div>
                <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
                    <p class="text-lg lg:text-xl">Time:</p>
                    <TimePicker bind:start={$recurringForm.starts} bind:end={$recurringForm.ends}></TimePicker>
                </div>
                <Combobox bind:value={$recurringForm.recurring} list={recurringList} labelString="Recurring:" placeholder="" className="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]" labelClass="text-lg lg:text-xl" inputClass="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700" let:detail let:selected>
                    {detail.name}
                </Combobox>
                <Combobox bind:value={$recurringForm.day} list={dayList} labelString="Day:" placeholder="" className="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]" labelClass="text-lg lg:text-xl" inputClass="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700" let:detail let:selected>
                    {detail.name}
                </Combobox>
                {#if $recurringForm.recurring == "Monthly"}
                    <div transition:slide class="pt-4">
                        <Combobox bind:value={$recurringForm.week} list={weekList} labelString="Week:" placeholder="First Week of the Month" className="flex gap-1 items-center min-w-[350px] max-w-[75%]" labelClass="text-lg lg:text-xl" inputClass="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700" let:detail let:selected>
                            {detail.name}
                        </Combobox>
                    </div>
                {/if}
                <div class="flex gap-2 mt-6 items-center lg:gap-3">
                    <button on:click|preventDefault={() => { $recurringForm.virtual = !$recurringForm.virtual }} class="p-1 {$recurringForm.virtual ? "border-blue-700 dark:border-blue-500 bg-blue-200 dark:bg-blue-900 text-blue-700 dark:text-blue-500" : "border-border-light dark:border-border-dark text-border-light dark:text-border-dark"} border-[1px] rounded-md m-0.5 transition disabled:cursor-not-allowed disabled:opacity-40">
                        <Icon icon=check></Icon>
                    </button>
                    <p class="text-lg">Create a Google Meet link.</p>
                </div>
                <Error allErrors={recurringErrors} message={recurringMessage}></Error>
                <div class="flex items-center mt-6 gap-4">
                    <button class="b-primary lg:p-1 lg:px-2 lg:text-lg flex items-center gap-1">
                        <Icon scale=1.25rem icon=save></Icon>
                        <p class="text-inherit">Save</p>
                    </button>
                    {#if $recurringDelayed}
                        <Loading></Loading>
                    {/if}
                </div>
            </form>
        </div>
    </div> 
</div> 