import { DISCORD, CHANNEL, PRIVATE_KEY, DOMAIN } from "$env/static/private";
import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import type { DiscordRole } from "$lib/Roles/role";
import crypto from 'crypto';
import { attachmentHelpers } from '$lib/Meetings/meetings.server';
import { error } from "@sveltejs/kit";
import type { Meeting } from "$lib/Meetings/helpers.server";
import dnt from 'date-and-time';
import meridiem from "date-and-time/plugin/meridiem";

dnt.plugin(meridiem);

interface DiscordUser {
    id: string,
    nickname: boolean,
    color: string | null,
    username: string,
    discrim: string,
    avatar: string,
    bot: boolean
}

export async function getRoles() {
    const request = JSON.stringify(await getRequestObject(undefined, "GET", "/server/role"));

    console.log(request);

    const result = await fetch(DISCORD + "/server/role", {
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

export async function getUsers() {
    const request = JSON.stringify(await getRequestObject(undefined, "GET", "/server/member"));

    console.log(request);

    const result = await fetch(DISCORD + "/server/member", {
        method: "GET",
        headers: {
            'content-type': 'application/json',
            'Authorization': request,
        },
    })

    const users = await result.json();

    return users as DiscordUser[];
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
    }

    if(links.length > 0) message.links = links;
    if(photos.length > 0) message.attachments = photos;

    const request = JSON.stringify(await getRequestObject(message, "POST", "/post/message/" + CHANNEL));

    console.log(request);

    const result = await fetch(DISCORD + "/post/message/" + CHANNEL, {
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

export async function sendDM(content: string, id: string) {
    let message: any = {
        content: content,
    }

    const request = JSON.stringify(await getRequestObject(message, "POST", "/post/dm/" + id));

    console.log(request);

    const result = await fetch(DISCORD + "/post/dm/" + id, {
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

export async function sendConfirmation(meeting: Meeting, id: string) {
    let time = dnt.format(meeting.starts, "h:mm a") + " - " + dnt.format(meeting.ends, "h:mm a");

    let message: any = {
        embeds: [
            {
                title: 'Are you going to ' + meeting.name + ' tomorrow from ' + time + '?',
                color: '#f0dd30',
                description: 'This is a meeting confirmation message, if you would like to change where you get meeting confirmations, please go to your account settings.'
            }
        ],
        links: [
            {
                label: "Confirm",
                url: DOMAIN + "/meetings/" + meeting.id,
            }
        ]
    }

    const request = JSON.stringify(await getRequestObject(message, "POST", "/post/dm/" + id));

    console.log(request);

    const result = await fetch(DISCORD + "/post/dm/" + id, {
        method: "POST",
        headers: {
            'content-type': 'application/json',
        },
        body: request
    })

    if(result.status != 200) {
        throw error(501, "Discord message not sent");
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