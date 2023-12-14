<script lang="ts">
    import { onMount } from "svelte";
    import Resumable from 'resumablejs';

    let browse: HTMLElement;
    let drop: HTMLElement;

    onMount(() => {
        let resumable = new Resumable({
            target: '/test/upload',
            query: { upload_token: 'my_token' },
        })

        resumable.assignBrowse(browse, false);
        resumable.assignDrop(drop);
    })
</script>

<div class="w-64 h-24 bg-white rounded-lg p-8 m-16 mt-24 flex justify-around items-center" bind:this={drop}>
    <span bind:this={drop} class="bg-black">Browse for File</span>
</div>