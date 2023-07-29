<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";

    export let reduced = false;
    export let verified = false;
</script>

<a href="/help/{verified ? "verification" : "kicked"}" class="bg-opacity-30 dark:bg-opacity-20 {verified ? "bg-green-500 dark:text-green-500 text-green-900" : "bg-red-500 dark:text-red-500 text-red-900"} p-1.5 px-3 text-lg rounded-md flex justify-around {reduced ? "w-full" : "ml-4"}"><span class="flex items-center"><Icon rounded class="mr-1 -translate-y-[1px]" icon={verified ? "verified" : "warning"}></Icon><span class="text-xl">{verified ? "Verified" : "Kicked"}</span></span></a>