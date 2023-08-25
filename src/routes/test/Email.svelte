<script lang=ts>
    import { Button, Column, Html, Img, Link, Section, Text } from 'svelte-email';

    export let personal: string;
    export let team: string;
    export let id: string;
</script>

<Html lang="en">
    <div style="display: flex; align-items: center; gap: 1rem; marginBottom: 2rem">
        <Img style={{ borderRadius: "0.5rem "}} width="36" height="36" alt="Skywalkers Logo" src="https://skywalkers.alexest.net/favicon.webp"/>
        <Text style={{ fontSize: "1.125rem", lineHeight: "1.75rem" }}>Skywalkers Team Website</Text>
    </div>
    
    <Text>You've been invited to the Skywalkers Team Website!</Text>
    
    <Text style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>Click though this verify link to join:</Text>
    
    <Button href="https://skywalkers.alexest.net/verify/{id}" style={{ borderRadius: "0.375rem", backgroundColor: "rgb(57 79 127)", color: "#ffffff", fontSize: "1.125rem", lineHeight: "1.75rem", paddingLeft: "1rem", paddingRight: "1rem", paddingTop: "0.5rem", paddingBottom: "0.5rem" }}>Verify</Button>
    
    <Text style={{ marginTop: "2rem", marginBottom: "1rem" }}>Or enter these codes on <Link href="https://skywalkers.alexest.net/">skywalkers.alexest.net</Link>:</Text>
    
    <table>
        <tr>
            <td>
                <Text style={{margin: "0px"}}>Personal</Text>
            </td>
            <td>
                <Text style={{margin: "0px"}}>Team</Text>
            </td>
        </tr>
        <tr style="padding-left: 1rem">
            <td>
                <Text style={{ borderRadius: "0.375rem", backgroundColor: "rgb(57 79 127)", color: "#ffffff", fontSize: "1.125rem", lineHeight: "1.75rem", paddingLeft: "1rem", paddingRight: "1rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", marginTop: "0.5rem" }}>{personal}</Text>
            </td>
            <td>
                <Text style={{ borderRadius: "0.375rem", backgroundColor: "rgb(57 79 127)", color: "#ffffff", fontSize: "1.125rem", lineHeight: "1.75rem", paddingLeft: "1rem", paddingRight: "1rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", marginTop: "0.5rem"  }}>{team}</Text>
            </td>
        </tr>
    </table>
    
    <Text style={{ marginTop: "2rem" }}>If you have any questions, please ask on the discord server.</Text>
    
    <Text style={{ marginTop: "1rem", marginBottom: "0rem" }}>Thanks,</Text>
    <Text style={{ marginTop: "0rem" }}>Skywalkers Team</Text>
</Html>