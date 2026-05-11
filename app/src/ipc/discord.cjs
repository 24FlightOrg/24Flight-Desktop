const DiscordRPC = require('discord-rpc-electron');

let startTimestamp;
let rpcClient = null;
let currentState = 'Browsing the Menus';

async function setupRPC() {
    const clientId = '1402033275425259581';

    DiscordRPC.register(clientId);
    startTimestamp = new Date();

    const rpc = new DiscordRPC.Client({ transport: 'ipc' });

    rpc.on('ready', () => {
        console.log('Discord RPC connected');

        rpc.setActivity({
            details: 'Flying on 24Flight',
            state: currentState,
            startTimestamp: startTimestamp,
            largeImageKey: '24flight_logo',
            largeImageText: '24Flight Desktop',
            instance: false,
            buttons: [
                { label: 'Join the Discord', url: 'https://discord.gg/qGBJnRTQvB' },
                { label: 'Visit 24Flight', url: 'https://24flight.org' }
            ]
        }).catch(console.error);
    });

    rpc.on('disconnected', () => {
        console.warn('Discord RPC disconnected');
        rpcClient = null;
    });

    try {
        await rpc.login({ clientId });
        rpcClient = rpc;
        console.log('Discord RPC initialized');
    } catch (err) {
        console.warn('Discord RPC failed to connect (Discord may not be running):', err.message);
    }

    return rpc;
}

function getStartTimestamp() {
    return startTimestamp;
}

function setStartTimestamp(timestamp) {
    startTimestamp = timestamp;
    if (rpcClient) {
        updateActivity('In the skies');
    }
}

function updateActivity(state) {
    currentState = state;
    if (rpcClient) {
        rpcClient.setActivity({
            details: 'Flying on 24Flight',
            state: state,
            startTimestamp: startTimestamp,
            largeImageKey: '24flight_logo',
            largeImageText: '24Flight Desktop',
            instance: false,
            buttons: [
                { label: 'Join the Discord', url: 'https://discord.gg/qGBJnRTQvB' },
                { label: 'Visit 24Flight', url: 'https://24flight.org' }
            ]
        }).catch(console.error);
    }
}

module.exports = { setupRPC, getStartTimestamp, setStartTimestamp, updateActivity };