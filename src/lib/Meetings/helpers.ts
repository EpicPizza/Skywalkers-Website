import type { SecondaryUser } from "$lib/Firebase/firebase";

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