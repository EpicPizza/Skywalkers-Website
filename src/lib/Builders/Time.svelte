<script lang=ts>
    import TimeAgo from 'javascript-time-ago'
    import en from 'javascript-time-ago/locale/en'
    import { onMount } from 'svelte';

    TimeAgo.addLocale(en)

    export let time: Date;

    const toRelative = new TimeAgo('en-US')

    let relativeString: string;
    let updateWhen: number | undefined;

    update(false);

    onMount(() => {
        setTimeout(() => {
            update(true);
        }, updateWhen == undefined ? 1000 * 60 : updateWhen);
    })

    function update(updateAgain: boolean) {
        const [string, timeToNextUpdate] = toRelative.format(time, {
            getTimeToNextUpdate: true,
        })

        relativeString = string;
        updateWhen = timeToNextUpdate;

        if(updateAgain) {
            setTimeout(() => {
                update(true);
            }, updateWhen == undefined ? 1000 * 60 : updateWhen);
        }
    }
</script>

<slot string={relativeString}/>