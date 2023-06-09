<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import { mode, warning } from "$lib/stores";
    import { get } from "svelte/store";
    import { onMount } from "svelte";
    import colors, { current } from 'tailwindcss/colors'
    import { tweened } from 'svelte/motion';
    import { cubicOut } from "svelte/easing";
    import { fade } from "svelte/transition";

    let color: string;
    let message: string;
    let popup: boolean;
    let id: number;

    let delay = tweened(0, {
        duration: 20000,
    })

    onMount(() => {
        warning.subscribe(async (value) => {
            if(value == undefined) return;

            id = Math.random() * 100;
            let current = id;

            popup = true;

            switch(value.color) {
                case 'red':
                    color = colors.red[500];
                    break;
                case 'yellow':
                    color = colors.yellow[300];
                    break;
                case 'aqua':
                    color = colors.blue[400];
                    break;
                case 'green':
                    color = colors.green[500];
                    break;
                case 'default':
                    if(get(mode) == 'dark') {
                        color = colors.gray[200];
                    }  else {
                        color = colors.black;
                    }
                    break;
            }

            message = value.message;

            delay.set(1, {
                duration: 0
            })

            await delay.set(0);

            if(current == id) { //prevent closing subsequent warning popups
                popup = false;
            }
        })
    })
</script>

{#if popup}
    <div out:fade class="absolute bottom-0 left-0 ml-2 mb-2 bg-backgroud-light dark:bg-backgroud-dark rounded-md border-border-light dark:border-border-dark border-[1px] shadow-2xl overflow-auto">
        <div class="relative flex items-center p-4">
            <p class="whitespace-nowrap">{message}</p>
            <button class="b-clear ml-4" on:click={() => {popup = false;}}>
                <Icon scale=1.75rem icon=close/>
            </button>
        </div>
        <div style="width: {$delay * 100}%; background-color: {color};" class="absolute h-1 bottom-0 left-0"></div>
    </div>
{/if}