import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import type { Role } from "./role";
import type { SecondaryUser } from "$lib/Firebase/firebase";

export async function getRoles(team: string) {
    const db = firebaseAdmin.getFirestore();

    const roleDocs = await db.collection('teams').doc(team).collection('roles').get();

    const roles = new Array<Role>();

    let promises = new Array<Promise<any>>()
    
    roleDocs.forEach((doc) => {
        let members = getMembers(doc.data().members as DocumentReference[]);

        roles.push({
            color: doc.data().color as string,
            permissions: doc.data().permissions as string[],
            level: doc.data().level as number,
            name: doc.data().name as string,
            connectTo: doc.data().connectTo as string | null,
            members: members as unknown as SecondaryUser[],
            id: doc.id,
        })
    })

    await Promise.all(promises);

    roles.sort((a, b) => b.level - a.level);

    return roles;
}

export async function getSpecifiedRoles(refs: DocumentReference[], team: string | undefined = undefined) {
    const roles = new Array<Role>();

    if(team != undefined) {
        const everyone = (await firebaseAdmin.getFirestore().collection('teams').doc(team).collection('roles').where('level', '==', 0).get()).docs[0];

        roles.push({
            color: everyone.data().color as string,
            permissions: everyone.data().permissions as string[],
            level: everyone.data().level as number,
            name: everyone.data().name as string,
            connectTo: everyone.data().connectTo as string | null,
            members: [],
            id: everyone.ref.id,
        })
    }

    for(let i = 0; i < refs.length; i++) {
        const doc = (await refs[i].get()).data();

        if(doc != undefined) {
            roles.push({
                color: doc.color as string,
                permissions: doc.permissions as string[],
                level: doc.level as number,
                name: doc.name as string,
                connectTo: doc.connectTo as string | null,
                members: [],
                id: refs[i].id,
            })
        }
    }

    return roles;
}

export async function getSpecifiedRolesWithTransaction(refs: DocumentReference[], transaction: Transaction, team: string) {
    const roles = new Array<Role>();

    const everyone = (await transaction.get(firebaseAdmin.getFirestore().collection('teams').doc(team).collection('roles').where('level', '==', 0))).docs[0];

    roles.push({
        color: everyone.data().color as string,
        permissions: everyone.data().permissions as string[],
        level: everyone.data().level as number,
        name: everyone.data().name as string,
        connectTo: everyone.data().connectTo as string | null,
        members: [],
        id: everyone.ref.id,
    })

    for(let i = 0; i < refs.length; i++) {
        const doc = (await transaction.get(refs[i])).data();

        if(doc != undefined) {
            roles.push({
                color: doc.color as string,
                permissions: doc.permissions as string[],
                level: doc.level as number,
                name: doc.name as string,
                connectTo: doc.connectTo as string | null,
                members: [],
                id: refs[i].id,
            })
        }
    }

    return roles;
}

async function getMembers(ids: DocumentReference[]) {
    let members = new Array<SecondaryUser>()

    for(let i = 0; i < ids.length; i++) {
        const user = (await firebaseAdmin.getFirestore().collection('users').doc(ids[i].id).get()).data() as any;

        if(user == undefined)

        members.push({
            ...user,
            id: ids[i],
        } as SecondaryUser);
    }

    return members;
}

async function getMembersFromTransaction(ids: DocumentReference[], transaction: Transaction) {
    let members = new Array<SecondaryUser>()

    for(let i = 0; i < ids.length; i++) { 
        const user = (await transaction.get(firebaseAdmin.getFirestore().collection('users').doc(ids[i].id))).data() as any;

        if(user == undefined)

        members.push({
            ...user,
            id: ids[i],
        } as SecondaryUser);
    }

    return members;
}

export async function getRolesWithTransaction(team: string, transaction: Transaction, withMembers: boolean = false) {
    const ref = firebaseAdmin.getFirestore().collection('teams').doc(team).collection('roles');

    const roleDocs = (await transaction.get(ref)).docs;

    const roles = new Array<Role>();
    
    roleDocs.forEach(async (doc) => {
        roles.push({
            color: doc.data().color as string,
            permissions: doc.data().permissions as string[],
            level: doc.data().level as number,
            name: doc.data().name as string,
            connectTo: doc.data().connectTo as string | null,
            members: withMembers ? await getMembersFromTransaction(doc.data().members as DocumentReference[], transaction) : [],
            id: doc.id,
        })
    })

    roles.sort((a, b) => b.level - a.level);

    return roles;
}