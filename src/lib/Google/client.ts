import { OAuth2Client } from "google-auth-library";
import keys from '../../../client_secret.json';
import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { calendar_v3, google } from "googleapis";
import { sendDM } from "$lib/Discord/discord.server";
import { GOOGLE_KEY, OWNER } from "$env/static/private";
import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

let oAuth2Client: undefined | OAuth2Client = undefined

export async function getClientWithCrendentials() {
    const client = getClient();

    const res = await init();

    if(!res) {
        return undefined;
    }

    return client;
}

export function getClient() {
    if(oAuth2Client == undefined) {
        oAuth2Client = new OAuth2Client(
            keys.installed.client_id,
            keys.installed.client_secret,
            keys.installed.redirect_uris[0]
        );

        oAuth2Client.on('tokens', async (tokens) => {
            if(tokens.refresh_token) {
                const db = firebaseAdmin.getFirestore();
    
                const { encryptedValue, iv } = await encrypt(JSON.stringify(tokens));
    
                await db.collection('google').doc('main').set({
                    tokens: encryptedValue,
                    iv: iv,
                })
            }
        })
    }

    return oAuth2Client;
}

export async function getCalendar(): Promise<calendar_v3.Calendar | undefined> {
    const client = await getClientWithCrendentials();

    if(client == undefined) {
        await sendDM("Authorization Needed", OWNER);

        process.exit();
    }

    try {
        const tokenInfo = await client.getTokenInfo((await client.getAccessToken()).token ?? "");

        if(!tokenInfo.scopes.includes('https://www.googleapis.com/auth/calendar')) {
            client.revokeCredentials();

            throw new Error("Not Signed In");
        }
    } catch(e: any) {
        return undefined;
    }

    return google.calendar({version: 'v3', client} as any);
}

async function init() {
    if(!oAuth2Client) return;

    const db = firebaseAdmin.getFirestore();

    const doc = await db.collection('google').doc('main').get();

    const data = doc.data();

    if(doc.exists && data && 'tokens' in data && 'iv' in data) {
        let encryptedValue = data.tokens;
        let iv = data.iv;

        const { value } = await decrypt(encryptedValue, iv);

        const tokens = JSON.parse(value);

        console.log(tokens);

        oAuth2Client.setCredentials(tokens);

        try {
            await oAuth2Client.getTokenInfo((await oAuth2Client.getAccessToken()).token ?? "");
        } catch(e) {
            console.log(e);

            return false;
        }

        return true;
    } else {
        return false;
    }
}

export async function encrypt(value: string) {
    const key = Buffer.from(GOOGLE_KEY, 'hex');
    const iv = randomBytes(16);

    const cipher = createCipheriv('aes256', key, iv);

    const encryptedValue = cipher.update(value, 'utf8', 'hex') + cipher.final('hex');

    return { encryptedValue, iv: iv.toString('hex') };
}

export async function decrypt(encryptedValue: string, iv: string) {
    const key = Buffer.from(GOOGLE_KEY, 'hex');

    const decipher = createDecipheriv('aes256', key, Buffer.from(iv, 'hex'));

    const value = decipher.update(encryptedValue, 'hex', 'utf8') + decipher.final('utf8');

    return { value };
}