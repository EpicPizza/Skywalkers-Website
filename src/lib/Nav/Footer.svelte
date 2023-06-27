<script>
    import Link from "$lib/Builders/Link.svelte";

</script>
<div class="w-full bg-black p-8">
    <div class="flex">
        <img alt="logo" src="/favicon.webp" class="border-[1px] border-zinc-500 max-h-[4rem] max-w-[4rem] rounded-lg">
        <div class="ml-4 leading-7">
            <p class="text-white">FRC Skywalkers #8404</p>
            <p class="text-white">Based in Fremont, CA</p>
            <p class="text-white">Email us at <Link href="mailto:frc.skywalkers@gmail.com">frc.skywalkers@gmail.com</Link></p>
            <p class="text-white">Our <Link href="https://www.frcskywalkers.org/">Public Website</Link></p>
        </div>
    </div>
</div>