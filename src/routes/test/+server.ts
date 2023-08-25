import { json } from '@sveltejs/kit';
import { render } from 'svelte-email';
import Email from './Email.svelte';

export function GET() {
	const html = render({
        template: Email,
        props: {
            personal: "238492",
            team: "238492",
            id: "asdjfk-23849-asdjfk-23489"
        }
    });

    console.log(html);

	return json({
        html
    });
}