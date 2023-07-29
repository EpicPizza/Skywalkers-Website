import { PRIVATE_KEY } from "$env/static/private";
import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import type { DiscordRole } from "$lib/Roles/role";
import crypto from 'crypto';

export async function getRoles() {
    const db = firebaseAdmin.getFirestore();

    const otp = await generateOTP();

    await db.collection('otp').doc(otp).set({
        timestamp: new Date()
    })

    const request = {
        signature: "",
        data: {
            timestamp: JSON.stringify(new Date()).replace(/"/g, ""),
            otp: otp,
            path: "/server/role",
            method: "GET",
        }
    }

    const message = Buffer.from(JSON.stringify(request.data));

    const signature = crypto.sign('rsa-sha256', message, PRIVATE_KEY);

    request.signature = signature.toString('base64');

    const result = await fetch("http://localhost:1357/server/role", {
        method: "GET",
        headers: {
            'content-type': 'application/json',
            'Authorization': JSON.stringify(request),
        },
    })

    const roles = await result.json();

    for(let i = 0; i < roles.length; i++) {
        if(roles[i].name == "@everyone") {
            roles.splice(i, 1);
            return roles as DiscordRole[];
        }
    }

    return roles as DiscordRole[];
}

const generateOTP = () => new Promise<string>(resolve =>
	crypto.randomBytes(5, (err, buffer) => {
		resolve(
			parseInt(buffer.toString("hex"), 16)
				.toString()
				.substring(0, 10)
		);
	})
);