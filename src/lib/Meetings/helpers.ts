import type { SecondaryUser } from "$lib/Firebase/firebase";
import type { Role } from "$lib/Roles/role";

export function getDefault(id: string): SecondaryUser {
    return {
        id: id,
        permissions: [],
        level: 0,
        photoURL: "/unknown.webp",
        displayName: "User Not Found",
        role: "unknown",
        team: "unknown",
        pronouns: "",
        roles: [],
    }
}

export function getDefaultRole(id: string): Role {
    return {
        color: "#000000", 
        permissions: [], 
        connectTo: null,
        level: -1, 
        name: "Not Found", 
        id: id, 
        members: [],
    }
}