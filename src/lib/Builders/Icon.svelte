<script lang="ts">
    export let icon: string;
    export let scale: string = "1.5";
    export let color: string = "inherit";
    export let style: string = "";
    export let rounded: boolean = false;
</script>

<div style="width:{scale}; height:{scale};" class="flex justify-around items-center">
    <span style="font-size:{scale}; color: {color}; {style}" class="material-symbols-{rounded ? "rounded" : "outlined"}">{icon}</span>
</div> 