import type { FirestoreUser, SecondaryUser } from "$lib/Firebase/firebase.js";
import { firebaseAdmin, getUser } from "$lib/Firebase/firebase.server.js";
import {
  completeSchema,
  editSchema,
  getUserList,
} from "$lib/Meetings/meetings.server.js";
import { attachmentHelpers } from "$lib/Meetings/meetings.server";
import type { Role } from "$lib/Roles/role";
import { getRole, getSpecifiedRoles } from "$lib/Roles/role.server.js";
import { error, fail, redirect } from "@sveltejs/kit";
import type { DocumentReference } from "firebase-admin/firestore";
import { message, superValidate } from "sveltekit-superforms/server";
import type { z } from "zod";
import {
  fileTypeFromBlob,
  fileTypeFromBuffer,
  fileTypeFromFile,
  fileTypeFromStream,
} from "file-type";
import { getDownloadURL } from "firebase-admin/storage";
import path from "path";
import { extension, lookup } from "mime-types";
import { meetingIndicator, type Hours } from "$lib/Hours/hours.server";
import { DOMAIN } from "$env/static/private";
import meridiem from "date-and-time/plugin/meridiem";
import format from "date-and-time";
import {
  type FetchedMeeting,
  getFetchedMeeting,
  editSynopsis,
} from "$lib/Meetings/helpers.server";
import { getQueueById, type Queue } from "$lib/Upload/helpers.server";

format.plugin(meridiem);

export async function load({ params, locals, url }) {
  if (locals.user == undefined) throw error(403, "Sign In Required");

  if (locals.team == undefined || locals.firestoreUser == undefined)
    throw redirect(307, "/verify?needverify=true");

  if (!locals.permissions.includes("EDIT_SYNOPSES"))
    throw error(403, "Unauthorized.");

  const ref = firebaseAdmin
    .getFirestore()
    .collection("teams")
    .doc(locals.team)
    .collection("synopsis")
    .doc(params.slug);

  const data = (await ref.get()).data();

  if (data == undefined) throw error(404, "Synopsis Not Found");

  let urls = data.urls as {
    url: string;
    type: string;
    name: string;
    location: string;
    code: string;
    ext: string;
  }[];

  let form = await superValidate(editSchema);

  let hours = new Array<{ id: string; time: number }>();

  for (let i = 0; i < data.hours.length; i++) {
    hours.push({
      id: data.hours[i].member.id as string,
      time: data.hours[i].time as number,
    });
  }

  form.data.id = params.slug;
  form.data.synopsis = data.synopsis;
  form.data.hours = hours;

  form.data.old = [];
  for (let i = 0; i < urls.length; i++) {
    form.data.old.push({
      name: urls[i].name + "." + urls[i].ext,
      image: attachmentHelpers.isImage(urls[i].type) ? "true" : "false",
      description: urls[i].ext + ", added",
      remove: false,
    });
  }

  let meeting: FetchedMeeting | false = false;

  try {
    meeting = await getFetchedMeeting(
      params.slug,
      locals.user.uid,
      locals.team,
    );
  } catch (e: any) {
    if ("type" in e && e.type == "display") {
      throw error(404, e.message);
    } else {
      console.log(e);
    }
  }

  if (!meeting)
    throw error(404, "Huh, for some reason the meeting is not here.");

  const length =
    (meeting.ends.valueOf() - meeting.starts.valueOf()) / 1000 / 60 / 60;

  return {
    form: form,
    length: length,
  };
}

export const actions = {
  default: async function ({ request, locals, params }) {
    if (locals.user == undefined) throw error(403, "Sign In Required");

    if (locals.team == undefined || locals.firestoreUser == undefined)
      throw redirect(307, "/verify?needverify=true");

    if (!locals.permissions.includes("EDIT_SYNOPSES"))
      throw error(403, "Unauthorized.");

    const db = firebaseAdmin.getFirestore();

    let users = await getUserList(db, locals.team);

    const teamRef = db.collection("teams").doc(locals.team);

    const synopsisRef = teamRef.collection("synopsis").doc(params.slug);

    const synopsisData = (await synopsisRef.get()).data();

    if (synopsisData == undefined) throw error(401, "Synopsis not found.");

    let meeting: FetchedMeeting | false = false;

    try {
      meeting = await getFetchedMeeting(
        params.slug,
        locals.user.uid,
        locals.team,
      );
    } catch (e: any) {
      if ("type" in e && e.type == "display") {
        throw error(404, e.message);
      } else {
        console.log(e);
      }
    }

    if (!meeting)
      throw error(404, "Huh, for some reason the meeting is not here.");

    const notion = meeting.notion;

    const formData = await request.formData();

    const form = await superValidate(formData, editSchema);

    if (!form.valid) {
      return fail(400, { form });
    }

    for (let i = 0; i < form.data.hours.length; i++) {
      if (!users.includes(form.data.hours[i].id)) {
        return message(form, "User not found.");
      }
    }

    let urls: {
      url: string;
      type: string;
      name: string;
      location: string;
      code: string;
      ext: string;
    }[] = synopsisData.urls as any;

    let confirmedurls: {
      url: string;
      type: string;
      name: string;
      location: string;
      code: string;
      ext: string;
    }[] = [];
    let willdelete: string[] = [];
    for (let i = 0; i < urls.length; i++) {
      for (let j = 0; j < form.data.old.length; j++) {
        if (
          urls[i].name + "." + urls[i].ext == form.data.old[j].name &&
          form.data.old[j].remove
        ) {
          willdelete.push(
            `synopses/${params.slug}-${locals.team}/${urls[i].location}`,
          );
        } else if (urls[i].name + "." + urls[i].ext == form.data.old[j].name) {
          confirmedurls.push(urls[i]);
        }
      }
    }

    urls = confirmedurls;

    if (urls.length + form.data.new.length > 10) {
      return message(form, "Cannot have more than 10 attachments.");
    }

    let queues: Queue[] = [];

    for (let i = 0; i < form.data.new.length; i++) {
      const queue = await getQueueById(form.data.new[i]);

      if (!queue) return message(form, "File not found.");

      if (!queue.finished)
        return message(
          form,
          "Please make sure all files have finished uploading.",
        );

      if (!queue.type) return message(form, "Malformed file found.");

      queues.push(queue);
    }

    for (let i = 0; i < queues.length; i++) {
      const code = attachmentHelpers.getCode(urls);

      const desRef = firebaseAdmin
        .getBucket()
        .file(
          `synopses/${params.slug}-${locals.team}/${code}.${queues[i].type?.ext ?? "txt"}`,
        );
      const locRef = firebaseAdmin
        .getBucket()
        .file(`uploads/${queues[i].location}/complete`);
      //const locFol = firebaseAdmin.getBucket().file(`uploads/${queues[i].location}`);

      try {
        await locRef.copy(desRef);
        await desRef.setMetadata({
          contentDisposition:
            "inline; filename*=utf-8\\'\\'\"" +
              queues[i].name +
              "." +
              queues[i].type?.ext ?? "txt" + '"',
          contentType: queues[i].type?.mime ?? "text/plain",
        });
        //await locFol.delete();
      } catch (e) {
        return message(form, "Failed to upload attachment. Please try again.");
      }

      urls.push({
        url: await getDownloadURL(desRef),
        type: queues[i].type?.mime ?? "text/plain",
        name: queues[i].name,
        code: code,
        ext: queues[i].type?.ext ?? "txt",
        location: `${code}.${queues[i].type?.ext ?? "txt"}`,
      });
    }

    const team = locals.team;
    const uid = locals.user.uid;

    await db.runTransaction(async (t) => {
      if (!meeting)
        throw error(404, "Huh, for some reason the meeting is not here.");
      const synopsis = {
        synopsis: form.data.synopsis,
        hours: [] as { member: DocumentReference; time: number }[],
        urls: urls,
      };

      let toUpdate: {
        ref: DocumentReference;
        data: { total: number; entries: Hours["entries"] };
      }[] = new Array();

      let wentThrough: string[] = new Array();

      for (let i = 0; i < form.data.hours.length; i++) {
        wentThrough.push(form.data.hours[i].id);

        synopsis.hours.push({
          member: db.collection("users").doc(form.data.hours[i].id),
          time: form.data.hours[i].time,
        });

        const ref = db
          .collection("teams")
          .doc(team)
          .collection("hours")
          .doc(form.data.hours[i].id);

        const doc = await t.get(ref);

        if (!doc.exists) throw error(400, "Hours not found.");

        const data = doc.data() as Hours;

        if (!data) throw error(400, "Hours not found.");

        let change = false;
        let by = 0;
        (() => {
          for (let j = 0; j < data.entries.length; j++) {
            if (data.entries[j].id == params.slug) {
              if (data.entries[j].total != form.data.hours[i].time) {
                by = form.data.hours[i].time - data.entries[j].total;
                change = true;
                data.entries[j].history.push({
                  total: form.data.hours[i].time,
                  link: data.entries[j].history[data.entries[j].latest].link,
                  reason:
                    data.entries[j].history[data.entries[j].latest].reason,
                  id: uid,
                  date: new Date().valueOf(),
                  indicator:
                    data.entries[j].history[data.entries[j].latest].indicator,
                });
                data.entries[j].latest++;
                data.entries[j].total = form.data.hours[i].time;
              }
              return;
            }
          }

          change = true;
          by = form.data.hours[i].time;
          data.entries.push({
            latest: 0,
            total: form.data.hours[i].time,
            id: params.slug,
            history: [
              {
                total: form.data.hours[i].time,
                link:
                  DOMAIN + "/t/" + locals.team + "/synopsis/" + form.data.id,
                reason:
                  meeting.name + " - " + format.format(meeting.starts, "M/D/Y"),
                id: uid,
                date: new Date().valueOf(),
                indicator: meetingIndicator,
              },
            ],
          });
        })();

        if (change) {
          toUpdate.push({
            ref,
            data: {
              total: data.total + by,
              entries: data.entries,
            },
          });
        }
      }

      for (let i = 0; i < synopsisData.hours.length; i++) {
        if (!wentThrough.includes(synopsisData.hours[i].member.id)) {
          const ref = db
            .collection("teams")
            .doc(team)
            .collection("hours")
            .doc(synopsisData.hours[i].member.id);

          const doc = await t.get(ref);
          const data = doc.data() as Hours;

          if (doc.exists && data && data.deleted == false) {
            let by = 0;
            (() => {
              for (let j = 0; j < data.entries.length; j++) {
                if (data.entries[j].id == params.slug) {
                  by = 0 - data.entries[j].total;
                  data.entries[j].history.push({
                    total: 0,
                    link: data.entries[j].history[data.entries[j].latest].link,
                    reason:
                      data.entries[j].history[data.entries[j].latest].reason,
                    id: uid,
                    date: new Date().valueOf(),
                    indicator:
                      data.entries[j].history[data.entries[j].latest].indicator,
                  });
                  data.entries[j].latest++;
                  data.entries[j].total = 0;
                  return;
                }
              }
            })();

            toUpdate.push({
              ref,
              data: {
                total: data.total + by,
                entries: data.entries,
              },
            });

            synopsis.hours.push({
              member: db
                .collection("users")
                .doc(synopsisData.hours[i].member.id),
              time: 0,
            });
          }
        }
      }

      for (let i = 0; i < toUpdate.length; i++) {
        t.update(toUpdate[i].ref, toUpdate[i].data);
      }

      t.update(synopsisRef, synopsis);

      await editSynopsis(notion, team, synopsis);

      firebaseAdmin.addLogWithTransaction(
        "Synopsis edited.",
        "summarize",
        uid,
        t,
        team,
      );
    });

    for (let i = 0; i < willdelete.length; i++) {
      const path = willdelete[i];

      await new Promise((resolve) => {
        firebaseAdmin.getBucket().deleteFiles(
          {
            prefix: path,
          },
          (err, files) => {
            if (err) {
              console.log(err);

              throw error(
                501,
                "An unexpected error occurred, please contact us for further help.",
              );
            }

            resolve(null);
          },
        );
      });
    }

    return message(form, "Success");
  },
};
