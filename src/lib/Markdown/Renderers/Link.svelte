<script lang=ts>
    export let href: string = '';
    export let title: string | undefined = undefined;
</script>

<a class="text-blue-500 leading-7 dark:text-blue-500 hover:underline inline" target="_blank" {href} {title}><slot></slot></a>