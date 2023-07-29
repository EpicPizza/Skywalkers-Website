<script lang=ts>
    export let role: string;
    export let reduced: boolean = false;
</script>

<span class="p-1 px-2.5 {reduced ? "flex flex-col justify-around text-xl text-center w-full" : "hidden sm:block text-lg ml-2"} {(() => {
    if(role == 'parent') {
        return 'bg-red-500 dark:text-red-500 text-red-900';
    } else if(role == 'student') {
        return 'bg-green-500 dark:text-green-500 text-green-900';
    } else {
        return 'bg-yellow-500 dark:text-yellow-500 text-yellow-900'
    }
})()} bg-opacity-30 dark:bg-opacity-10 rounded-md">
    {role}
</span>