<script>

    import { mode } from "../stores";

</script>

<div class="p-4 flex flex-col justify-around items-center h-[calc(100dvh-4rem)] w-full bg-white dark:bg-zinc-800 bg-opacity-70 {$mode == 'dark' ? "pattern_dark" : "pattern_light"}">
    <slot></slot>
</div>

<style>
    .pattern_dark {
        background-image:  linear-gradient(30deg, #18181b 12%, transparent 12.5%, transparent 87%, #18181b 87.5%, #18181b), linear-gradient(150deg, #18181b 12%, transparent 12.5%, transparent 87%, #18181b 87.5%, #18181b), linear-gradient(30deg, #18181b 12%, transparent 12.5%, transparent 87%, #18181b 87.5%, #18181b), linear-gradient(150deg, #18181b 12%, transparent 12.5%, transparent 87%, #18181b 87.5%, #18181b), linear-gradient(60deg, #18181b77 25%, transparent 25.5%, transparent 75%, #18181b77 75%, #18181b77), linear-gradient(60deg, #18181b77 25%, transparent 25.5%, transparent 75%, #18181b77 75%, #18181b77);
        background-size: 20px 35px;
        background-position: 0 0, 0 0, 10px 18px, 10px 18px, 0 0, 10px 18px;
    }

    .pattern_light {
        background-image:  linear-gradient(30deg, #f1f5f9 12%, transparent 12.5%, transparent 87%, #f1f5f9 87.5%, #f1f5f9), linear-gradient(150deg, #f1f5f9 12%, transparent 12.5%, transparent 87%, #f1f5f9 87.5%, #f1f5f9), linear-gradient(30deg, #f1f5f9 12%, transparent 12.5%, transparent 87%, #f1f5f9 87.5%, #f1f5f9), linear-gradient(150deg, #f1f5f9 12%, transparent 12.5%, transparent 87%, #f1f5f9 87.5%, #f1f5f9), linear-gradient(60deg, #f1f5f977 25%, transparent 25.5%, transparent 75%, #f1f5f977 75%, #f1f5f977), linear-gradient(60deg, #f1f5f977 25%, transparent 25.5%, transparent 75%, #f1f5f977 75%, #f1f5f977);
        background-size: 20px 35px;
        background-position: 0 0, 0 0, 10px 18px, 10px 18px, 0 0, 10px 18px;
    }
</style>