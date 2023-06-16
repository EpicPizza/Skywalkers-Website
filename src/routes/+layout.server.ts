export const ssr = true;

export async function load({cookies, request, locals}) {
    const mode = cookies.get('theme');

    let user;

    if(locals.user != undefined) {
        user = {
            photoURL: locals.user.photoURL,
            displayName: locals.user.displayName,
            email: locals.user.email,
            uid: locals.user.uid,
            team: locals.firestoreUser == undefined ? undefined : locals.firestoreUser.team,
            role: locals.firestoreUser == undefined ? undefined : locals.firestoreUser.role,
            preload: true, //only exists for sake of comparing to real user object
        };
    } else {
        user = undefined;
    }

    return { mode: mode, preload: user, team: locals.team }; //do not use any of these directly, this layout load consistenly only runs on initial page load, instead used associated stores
}