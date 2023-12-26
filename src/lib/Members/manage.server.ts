import type { SecondaryUser } from "$lib/Firebase/firebase";
import { firebaseAdmin, getUser } from "$lib/Firebase/firebase.server";
import { getDefaultRole } from "$lib/Meetings/helpers";
import type { Role } from "$lib/Roles/role";
import { getRolesAsCache, getSpecifiedRoles, getSpecifiedRolesWithTransaction } from "$lib/Roles/role.server";
import { error } from "@sveltejs/kit";
import { randomBytes, scryptSync } from 'crypto';
import { FieldValue, type DocumentReference, type Transaction } from "firebase-admin/firestore";

export async function quarantineMember(id: string) {
    const db = firebaseAdmin.getFirestore();

    const quarantineRef = db.collection('quarantine').doc(id);

    const userRef = db.collection('users').doc(id);

    await db.runTransaction(async t => {
        const member = await getMemberWithTransaction(id, t);

        const hoursRef = db.collection('teams').doc(member.team).collection('hours').doc(member.id);

        const hours = await t.get(hoursRef);

        if(hours.exists && hours.data()) {
            t.update(hoursRef, {
                total: 0,
                entries: [],
                deleted: true,
                history: FieldValue.arrayUnion({ date: new Date().valueOf(), id: crypto.randomUUID(), data: { total: hours.data()?.total, entries: hours.data()?.entries } })
            });
        }

        for(let i = 0; i < member.roles.length; i++) {
            t.update(db.collection('teams').doc(member.team).collection('roles').doc(member.roles[i].id), {
                members: FieldValue.arrayRemove(db.collection('users').doc(id))
            })
        }

        t.create(quarantineRef, {
            id: id,
            team: member.team,
            data: {
                displayName: member.displayName,
                photoURL: member.photoURL,
                pronouns: member.pronouns,
                role: member.role,
                roles: ((roles: Role[]) => {
                    let array = new Array();
    
                    roles.forEach((role) => {
                        array.push(role.id);
                    })

                    return array;
                })(member.roles),
            }
        })

        t.delete(userRef);
    })
}

export async function unquarantineMember(id: string, adminRoles: Role[], data: QuarantinedMember["data"] | undefined) {
    const db = firebaseAdmin.getFirestore();

    await (async function check() {
        const member = await getQuarantinedMember(id);

        if(data != undefined) {
            member.data = data;
        }

        const roleRefs = new Array<DocumentReference>();

        for(let i = 0; i < member.data.roles.length; i++) {
            roleRefs.push(db.collection('teams').doc(member.team).collection('roles').doc(member.data.roles[i]))
        }

        const roles = await getSpecifiedRoles(roleRefs, member.team); //dw about everyone role, this fumction includes it for you

        console.log("Kicked", roles);
        console.log("Admin", adminRoles);

        let level = 0;
        let adminLevel = 0;

        for(let i = 0; i < roles.length; i++) {
            if(roles[i].level > level) {
                level = roles[i].level;
            }
        }

        for(let i = 0; i < adminRoles.length; i++) {
            if(adminRoles[i].level > adminLevel) {
                adminLevel = adminRoles[i].level;
            }
        }

        console.log("Kicked", level);
        console.log("Admin", adminLevel);

        if(level >= adminLevel) {
            throw new Error("Insufficient Permission Level");
        }
    })();

    const quarantineRef = db.collection('quarantine').doc(id);

    const userRef = db.collection('users').doc(id);

    await db.runTransaction(async t => {
        const member = await getQuarantinedMemberWithTransaction(id, t);

        if(data != undefined) {
            member.data = data;
        }

        const roleRefs = new Array<DocumentReference>();

        for(let i = 0; i < member.data.roles.length; i++) {
            const doc = await db.collection('teams').doc(member.team).collection('roles').doc(member.data.roles[i]).get();


            if(doc.exists) {
                roleRefs.push(doc.ref);
            }
        }

        console.log("refs", roleRefs);

        const roles = await getSpecifiedRolesWithTransaction(roleRefs, t, member.team); //dw about everyone role, this fumction includes it for you

        let level = 0;
        let permissions = new Array<string>();

        for(let i = 0; i < roles.length; i++) {
            if(roles[i].level > level) {
                level = roles[i].level;
            }

            for(let j = 0; j < roles[i].permissions.length; j++) {
                if(!permissions.includes(roles[i].permissions[j])) {
                    permissions.push(roles[i].permissions[j]);
                }
            }
        }

        for(let i = 0; i < roleRefs.length; i++) {
            for(let j = 0; j < roles.length; j++) {
                if(roles[j].name == 'everyone' && roles[j].id == roleRefs[i].id) {
                    roleRefs.splice(i, 1);
                }
            }
        }

        const hoursRef = db.collection('teams').doc(member.team).collection('hours').doc(member.id);

        const hours = await t.get(hoursRef);

        if(hours.exists && hours.data()) {
            t.update(hoursRef, {
                deleted: false,
            });
        }

        t.create(userRef, {
            displayName: member.data.displayName,
            level: level,
            permissions: permissions,
            photoURL: member.data.photoURL,
            pronouns: member.data.pronouns,
            role: member.data.role,
            roles: roleRefs,
            team: member.team
        })

        for(let i = 0; i < roleRefs.length; i++) {
            t.update(roleRefs[i], {
                members: FieldValue.arrayUnion(userRef),
            })
        }

        t.delete(quarantineRef);
    })
}

export async function getMemberCache(team: string, roles: Map<string, Role>): Promise<Map<string, SecondaryUser>> {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('users').where('team', '==', team);

    const docs = (await ref.get()).docs;

    const users = new Map<string, SecondaryUser>();

    for(let i = 0; i < docs.length; i++) {
        const doc = docs[i];

        const user = doc.data();

        if(user == undefined) throw new Error("User not found.");
    
        users.set(docs[i].id, {
            ...user,
            roles: Array.from(user.roles, (role: DocumentReference) => { return roles.get(role.id) ?? getDefaultRole(role.id) }),
            id: doc.id,
        } as SecondaryUser);
    }

    return users;
}

export async function getMember(id: string): Promise<SecondaryUser> {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('users').doc(id);

    const doc = await ref.get();

    if(!doc.exists) throw new Error("User not found.");

    const user = doc.data();

    if(user == undefined) throw new Error("User not found.");

    return {
        ...user,
        roles: await getSpecifiedRoles(user.roles),
        id: doc.id,
    } as SecondaryUser
}

export async function getQuarantinedMember(id: string): Promise<QuarantinedMember> {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('quarantine').doc(id);

    const doc = await ref.get();

    if(!doc.exists) throw new Error("User not found.");

    const user = doc.data();

    if(user == undefined) throw new Error("User not found.");

    return {
        ...user,
    } as QuarantinedMember
}

export async function getQuarantinedMemberInfo(id: string): Promise<QuarantinedMemberInfo> {
    const member = await getQuarantinedMember(id);

    const db = firebaseAdmin.getFirestore();

    const roleRefs = new Array<DocumentReference>();

    for(let i = 0; i < roleRefs.length; i++) {
        roleRefs.push(db.collection('teams').doc(member.team).collection('roles').doc(member.data.roles[i]))
    }

    const roles = await getSpecifiedRoles(roleRefs);

    return {
        id: member.id,
        team: member.team,
        data: {
            displayName: member.data.displayName,
            photoURL: member.data.photoURL,
            pronouns: member.data.pronouns,
            role: member.data.role,
            roles: roles,
        }
    }
}

export async function getQuarantinedMembers(team: string): Promise<QuarantinedMember[]> {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('quarantine').where('team', '==', team);

    const collection = await ref.get();

    let quarantinedMembers = new Array<QuarantinedMember>();

    for(let i = 0; i < collection.docs.length; i++) {
        if(collection.docs[i].data() != undefined) {
            quarantinedMembers.push({
                ...collection.docs[i].data()
            } as QuarantinedMember)
        }
    }

    return quarantinedMembers
}


export interface QuarantinedMember { 
    id: string,
    team: string,
    data: {
        displayName: string,
        photoURL: string,
        pronouns: string,
        role: string,
        roles: string[],
    }
}

export interface QuarantinedMemberInfo { 
    id: string,
    team: string,
    data: {
        displayName: string,
        photoURL: string,
        pronouns: string,
        role: string,
        roles: Role[],
    }
}

export async function getMemberWithTransaction(id: string, t: Transaction): Promise<SecondaryUser> {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('users').doc(id);

    const doc = await t.get(ref);

    if(!doc.exists) throw new Error("User not found.");

    const user = doc.data();

    if(user == undefined) throw new Error("User not found.");

    return {
        ...user,
        roles: await getSpecifiedRolesWithTransaction(user.roles, t, user.team),
        id: doc.id,
    } as SecondaryUser
}

export async function getQuarantinedMemberWithTransaction(id: string, t: Transaction): Promise<QuarantinedMember> {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('quarantine').doc(id);

    const doc = await t.get(ref);

    if(!doc.exists) throw new Error("User not found.");

    const user = doc.data();

    if(user == undefined) throw new Error("User not found.");

    return {
        ...user,
    } as QuarantinedMember
}