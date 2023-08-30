import type { calendar_v3 } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';

export async function createEvent(client: OAuth2Client, calendar: calendar_v3.Calendar, options: any) {
    return new Promise<{ id: string, link: string }>(resolve => {
        calendar.events.insert({
            auth: client,
            resource: options,
            calendarId: 'primary',
            conferenceDataVersion: 1
        } as any, function(err: any, event: any) {
            if(err) {
                console.log('There was an error with calendar api: ' + err);
                throw err;
            }
            resolve({ id: event.data.id, link: event.data.hangoutLink });
        })
    })
}

export async function editEvent(client: OAuth2Client, id: string, calendar: calendar_v3.Calendar, options: any) {
    return new Promise<{ id: string, link: string }>(resolve => {
        calendar.events.patch({
            auth: client,
            eventId: id,
            resource: options,
            calendarId: 'primary',
            sendNotifications: false,
            conferenceDataVersion: 1
        } as any, function(err: any, event: any) {
            if(err) {
                console.log('There was an error with calendar api: ' + err);
                return;
            }
            resolve({ id: event.data.id, link: event.data.hangoutLink });
        })
    });
}

export async function getEvent(client: OAuth2Client, id: string, calendar: calendar_v3.Calendar) {
    const res = await calendar.events.get({
        auth: client,
        eventId: id,
        calendarId: 'primary',
    });
    return res.data;
}

export async function deleteEvent(client: OAuth2Client, id: string, calendar: calendar_v3.Calendar) {
    const res = await calendar.events.delete({
        auth: client,
        eventId: id,
        calendarId: 'primary',
    });
    return res.data;
}