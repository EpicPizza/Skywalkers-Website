import { error, text } from '@sveltejs/kit';
import qrcode from 'qrcode-generator';
import { z } from 'zod';

const Number = z.coerce.number();

export async function GET({ params }) {
    let id = params.id;

    try {
        id = Number.parse(id).toString();
    } catch(e) {
        throw error(404, "Invalid Code");
    }

    let qr = await new Promise<string>((resolve) => {
        let qr = qrcode(0, 'H');
        qr.addData('https://skywalkers.alexest.net/batteries?id=' + id);
        qr.make();
        resolve(qr.createSvgTag());
    });

    return new Response(qr, {
        headers: {
            "Content-Type": "image/svg+xml",
            "Content-Disposition": "inline;filename=image.svg"
        }
    })
}