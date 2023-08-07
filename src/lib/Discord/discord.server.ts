import { GUILD, PRIVATE_KEY } from "$env/static/private";
import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import type { DiscordRole } from "$lib/Roles/role";
import crypto from 'crypto';
import { attachmentHelpers } from '$lib/Meetings/meetings.server';
import { error } from "@sveltejs/kit";

export async function getRoles() {
    const request = JSON.stringify(await getRequestObject(undefined, "GET", "/server/role"));

    console.log(request);

    const result = await fetch("http://localhost:1357/server/role", {
        method: "GET",
        headers: {
            'content-type': 'application/json',
            'Authorization': request,
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

export async function sendSynopsis(name: string, content: string, attachments: {url: string, type: string, name: string, location: string, code: string, ext: string }[], link: string) {
    let links: { url: string, label: string }[] = [];
    let photos: { url: string }[] = [];

    links.push({
        url: link,
        label: "View on Website"
    })

    for(let i = 0; i < attachments.length; i++) {
        let isPhoto = attachmentHelpers.isImage(attachments[i].type);

        if(isPhoto) {
            photos.push({
                url: attachments[i].url,
            })
        }
    }

    let message: any = {
        content: content,
        thread: name,
    }

    if(links.length > 0) message.links = links;
    if(photos.length > 0) message.attachments = photos;

    const request = JSON.stringify(await getRequestObject(message, "POST", "/post/message/" + GUILD));

    console.log(request);

    const result = await fetch("http://localhost:1357/post/message/" + GUILD, {
        method: "POST",
        headers: {
            'content-type': 'application/json',
        },
        body: request
    })

    if(result.status != 200) {
        throw error(501, "Discord synopsis not sent");
    }
}

export async function getRequestObject(options: any = undefined, method: string, path: string) {
    const db = firebaseAdmin.getFirestore();

    const otp = await generateOTP();

    await db.collection('otp').doc(otp).set({
        timestamp: new Date()
    })

    let request = {
        signature: "",
        data: JSON.stringify( {
            timestamp: JSON.stringify(new Date()).replace(/"/g, ""),
            otp: otp,
            path: path,
            method: method,
        })
    }

    if(options != undefined) {
        request = {
            signature: "",
            data: JSON.stringify({
                timestamp: JSON.stringify(new Date()).replace(/"/g, ""),
                otp: otp,
                path: path,
                method: method,
                options: options,
            })
        } as any;
    }

    const message = Buffer.from(request.data);

    console.log("Data", request.data);

    const signature = crypto.sign('rsa-sha256', message, PRIVATE_KEY);

    request.signature = signature.toString('base64');

    return request;
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