import type { SecondaryUser, firebaseClient } from "$lib/Firebase/firebase";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { get, writable, } from "svelte/store";
import { z } from "zod";

export const RoleForm = z.object({
    name: z.string({ required_error: "A name must be given.", invalid_type_error: "The name must be a string."}).min(1, { message: "The name must be at least one character long." }).max(32, { message: "The name cannot be more than 32 characters." }).toLowerCase().regex(/^[a-z]*$/, { message: "Only letters are allowed." }).refine((value) => value != 'everyone', { message: 'The name "everyone" is not allowed.'}),
    color: z.string({ required_error: "A color must be given.", invalid_type_error: "Invalid Color"}).regex(/^#([A-Fa-f0-9]{6})$/, { message: "Invalid Color" }),
})

export interface Role { color: string, permissions: string[], connectTo: string | null, level: number, name: string, id: string, members: SecondaryUser[] }
export interface DiscordRole { color: string, name: string, id: string };

export const clicked = writable(true);
export const sidebar = custom();

function custom() {
    const store = writable(false);

    return {
        subscribe: store.subscribe,
        set: (value: boolean) => {
            store.set(value);
        },
        update: (callback: Function) => {
            store.set(callback(get(store)));
        }
    }
}

export async function deleteRole(id: string) {
    await fetch('/api/roles/delete', {
        method: "POST",
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            role: id
        })
    })
}