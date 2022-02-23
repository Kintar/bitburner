/** @param {NS} ns **/
import { initCommonObject } from 'common';

/**
 * Attempt to run all port-opening programs on a host, regardless of whether or not we have them
 */
function portBreaker(host) {
    try {
        common.ns.brutessh(host);
    } catch { }
    try {
        common.ns.ftpcrack(host);
    } catch { }
    try {
        common.ns.relaysmtp(host);
    } catch { }
    try {
        common.ns.httpworm(host);
    } catch { }
    try {
        common.ns.sqlinject(host);
    } catch { }
}

let common;

export async function main(ns) {
    common = initCommonObject(ns);
    const args = ns.flags([
        ["nextScript", '']
    ]);

    if (!ns.getHostname() === 'home') {
        throw new Exception('Must be run from home!');
    }

    const serverMap = { servers: {}, lastUpdate: new Date().getTime() };
    const scanArray = ['home'];
    const player = common.getPlayerDetails();

    common.log(`Player hacking: ${player.hackingLevel}`);
    common.log(`Player porthacks: ${player.portHacks}`);
    let breached = 0;
    let serverCount = 0;
    while (scanArray.length) {
        serverCount++;
        const host = scanArray.shift();

        for (const file of ['common', 'weaken', 'hack', 'grow']) {
            await ns.scp(file + ".js", host);
        }
        
        if (!ns.hasRootAccess(host)) {
            if (ns.getServerNumPortsRequired(host) <= player.portHacks) {
                common.log(`Breaching ${host}...`);
                portBreaker(host);
                try {
                    ns.nuke(host);
                    common.log(`Gained root on ${host}`)
                    breached++;
                } catch {
                    common.log(`Failed to run nuke.exe on ${host}`)
                }
            }
        } else {
            breached++;
        }

        const connections = ns.scan(host);
        serverMap.servers[host] = ns.getServer(host);
        serverMap.servers[host].files = ns.ls(host);
        serverMap.servers[host].connections = connections;
        connections.filter(hostname => !serverMap.servers[hostname]).forEach(hostname => scanArray.push(hostname));
    }

    common.setItem(common.keys.serverMap, serverMap);

    common.log(`Identified ${serverCount} servers, of which ${breached} are breached.`);

    if (!args.nextScript) {
        common.log(`Done.`);
    } else {
        common.log(`Spawning ${args.nextScript}`);
        ns.spawn(args.nextScript, 1);
    }
}