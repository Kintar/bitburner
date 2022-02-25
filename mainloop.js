/** @param {NS} ns **/
import { initCommonObject, estimateHackPercentage, estimateHackingTime } from 'common'

const argsSchema = [
    ['breach', false]
]

const maxUpdateInterval = 1000 * 60 * 60;

let common;
let serverMap;

function toHackingData(hostData) {
    const player = common.getPlayerDetails();
    return {
        name: hostData.hostname,
        minDiff: hostData.minDifficulty,
        maxMoney: hostData.moneyMax,
        hackAmount: estimateHackPercentage(hostData.requiredHackingSkill, hostData.minDifficulty, player.hackingLevel),
        hackTime: estimateHackingTime(hostData.minDifficulty, hostData.requiredHackingSkill, player.hackingLevel),
        weakenTime: common.ns.getWeakenTime(hostData.hostname),
    };
}

export async function main(ns) {
    common = initCommonObject(ns);

    const args = ns.flags(argsSchema);
    
    // See if we need to refresh our server map
    serverMap = common.getItem(common.keys.serverMap);
    if (args.breanch || !serverMap || new Date().getTime() - serverMap.lastUpdate > maxUpdateInterval) {
        common.log('Refreshing server map...');
        ns.spawn('breach.js', 1, "--nextScript", ns.getScriptName());
    }

    // Now, find servers we can hack
    const playerdeets = common.getPlayerDetails();
    const hackables = [];
    for (let hostname in serverMap.servers) {
        if (hostname === 'home') continue;
        const host = serverMap.servers[hostname];
        if (host.requiredHackingSkill <= playerdeets.hackingLevel && host.hasAdminRights) {
            hackables.push(hostname);
        }
    }

    common.log(`Found ${hackables.length} targets`);
    const hackData = [];
    for (const host of hackables) {
        const hostData = serverMap.servers[host];
        hackData.push(toHackingData(hostData));
    }

    // Based on hack time, minimum security level, and maximum money, find the most efficient hacking target
    let selectedTarget = "";
    let selectedEfficiency = 0;
    for (const d of hackData) {
        const efficiency = (d.hackAmount * d.maxMoney) / d.hackTime;

        if (efficiency > selectedEfficiency) {
            selectedTarget = d;
            selectedEfficiency = efficiency;
        }
    }

    common.log(`Target selected:  ${selectedTarget.name}`);
    common.log(`Efficiency: ${ns.nFormat(selectedEfficiency, '00.00')}, with an expected return of ${ns.nFormat(selectedTarget.maxMoney * selectedTarget.hackAmount, '0,000,000.00')} per thread.`);
    common.log('Beginning weaken stage');
    ns.spawn('weaken_coordinator.js', 1, '--target', selectedTarget.name);
}