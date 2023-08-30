import { EMAIL } from '$env/static/private';
import { firebaseAdmin } from '$lib/Firebase/firebase.server';
import { decrypt, getClient } from '$lib/Google/client.js';
import { error, json } from '@sveltejs/kit';

export const GET = (async ({ url, locals }) => {
    if(!locals.user || locals.user.email != EMAIL) throw error(400, "Authentication Failed E1");

    if(url.searchParams.get('error')) return json(url.searchParams.get('error'));

    const code = url.searchParams.get('code');

    if(code == undefined || code == null) {
        throw error(400, "Authentication Failed E2");
    }

    const client = getClient();

    const verifier = await getVerifier();

    const res = await client.getToken({ code, codeVerifier: verifier });

    client.setCredentials(res.tokens);

    const tokenInfo = await client.getTokenInfo((await client.getAccessToken()).token ?? "");

    if(!tokenInfo.scopes.includes('https://www.googleapis.com/auth/calendar')) {
        client.revokeCredentials();

        throw error(400, "Authentication Failed E4");
    }

    return json("Authentication Success");
})

async function getVerifier() {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('google').doc('flow');

    const doc = await ref.get();

    const data = doc.data();

    if(!doc.exists || data == undefined || !('verifier' in data) || !('iv' in data)) {
        throw error(400, "Authentication Failed E3");
    }

    const verifier = data.verifier as string;
    const iv = data.iv as string;

    const { value } = await decrypt(verifier, iv);

    return value;
}