export async function getIceConfig() {
    const iceServersUrl = 'https://us-central1-amendadvicedemo.cloudfunctions.net/twilio_iceServers';
    const response = await fetch(iceServersUrl);
    const iceServers = await response.json();
    const configuration = {
        iceCandidatePoolSize: 10,
        iceServers: iceServers
    };
    return configuration;
}
