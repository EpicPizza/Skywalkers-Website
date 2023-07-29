<script lang=ts>
    import { flip } from 'svelte/animate';
    import { createEventDispatcher } from 'svelte';

    export let list: any[];
    export let ignore: number | number[] = -1;
    export let softIgnore: number = -1;
    export let disable: boolean = false;
    let isOver: string | boolean = false;

    const dispatch = createEventDispatcher();

    export let style = "";
    export { style as class };

    function getDraggedParent(node: any) {
        if(!node.dataset.index) {
            return getDraggedParent(node.parentNode);
        } else {
            return { ...node.dataset };
        }
    }

    function onDragStart(e: DragEvent) {
        const dragged = getDraggedParent(e.target);
        e.dataTransfer?.setData("text/plain", dragged?.index.toString());
    }

    function onDragOver(e: DragEvent) {
        const dragged = getDraggedParent(e.target);
        let over = dragged?.id ?? false;

        if(typeof over == 'string') {
            for(let i = 0; i < list.length; i++) {
                if(list[i].id == over) {
                    if((typeof ignore == 'object' ? !ignore.includes(i) : ignore != i)) {
                        isOver = over;
                        return;
                    } else {
                        isOver = false;
                        return;
                    }
                }
            }
        } else {
            isOver = false;
        }
    }

    function onDragLeave(e: DragEvent) {
        const dragged = getDraggedParent(e.target);
        isOver == dragged.id && (isOver = false);
    }

    function onDrop(e: DragEvent) {
        isOver = false;
        const dragged = getDraggedParent(e.target);
        reorder({
            from: e.dataTransfer?.getData("text/plain"),
            to: dragged.index,
        })
    }

    function reorder ({ from, to }: any) {
        dispatch("sort", { from, to });
    }
</script>

{#if list?.length}
    <ul class="list-none">
        {#each list as item, index (item.id)}
            <div 
                class={item.id === isOver ? style + "" : ""}
                data-index={index}
                data-id={item.id}
                draggable={(typeof ignore == 'object' ? ignore.includes(index) : ignore == index) || softIgnore == index || disable ? "false" : "true"}
                on:dragstart={onDragStart}
                on:dragover|preventDefault={onDragOver}
                on:dragleave={onDragLeave}
                on:drop|preventDefault={onDrop}
                animate:flip={{ duration: 300 }}
            >   
                <slot {item} {index}/>
            </div>
        {/each}
    </ul>
{/if}