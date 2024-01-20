import type { SecondaryUser } from "$lib/Firebase/firebase";
import type { Role } from "$lib/Roles/role";

export function getDefault(id: string): SecondaryUser {
  return {
    id: id,
    photoURL: "/unknown.webp",
    displayName: "User Not Found",
    pronouns: "",
    teams: [],
  };
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
  };
}
