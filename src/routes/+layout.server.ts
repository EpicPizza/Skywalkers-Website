export const ssr = true;

export async function load({cookies, request, locals}) {
    console.log("THIS IS RUNNING");

    const mode = cookies.get('theme');

    let user;

    if(locals.user != undefined) {
        user = {
            photoURL: locals.user.photoURL,
            displayName: locals.user.displayName,
            email: locals.user.email,
            uid: locals.user.uid,
            pronouns: locals.firestoreUser == undefined ? undefined : locals.firestoreUser.pronouns,
            team: locals.firestoreUser == undefined ? undefined : locals.firestoreUser.team,
            role: locals.firestoreUser == undefined ? undefined : locals.firestoreUser.role,
            roles: locals.firestoreUser == undefined ? undefined : locals.firestoreUser.roles,
            permissions: locals.firestoreUser == undefined ? undefined : locals.firestoreUser.permissions,
            level: locals.firestoreUser == undefined ? undefined : locals.firestoreUser.level,
            preload: true, //only exists for sake of comparing to real user object
        };
    } else {
        user = undefined;
    }

    console.log("kicked", locals.kicked);

    return { kicked: locals.kicked, mode: mode, preload: user, team: locals.team }; //do not use any of these directly, this layout load consistenly only runs on initial page load, instead used associated stores
}