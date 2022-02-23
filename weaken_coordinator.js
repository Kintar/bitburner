/** @param {NS} ns **/
import { initCommonObject } from 'common';

let common;
const argsSchema = [
    ['target', ''],
]
export async function main(ns) {
    common = initCommonObject(ns);
    const args = ns.flags(argsSchema);
    if (!args.target) {
        throw new Error('Must specify target.');
    }

    while (true) {
        let server = ns.getServer(args.target);
        let serverMap = common.getItem(common.keys.serverMap).servers;
        let currentSecurity = server.hackDifficulty;
        let targetSecurity = server.minDifficulty;

        let finalValue = ns.getServerSecurityLevel(args.target);
        common.log(`${args.target} currently at security level ${finalValue}`);
        if (Math.abs(finalValue - targetSecurity) < 5) {
            common.log('Completed weaken phase.');
            ns.spawn('grow_coordinator.js', 1, '--target', args.target);
        }

        let usableHosts = [];
        for (let hostname in serverMap) {
            if (serverMap[hostname].hasAdminRights) {
                usableHosts.push(hostname);
            }
        }

        if (usableHosts.length == 0) {
            throw new Error("found no usable hosts!");
        }

        let weakenEffect = ns.weakenAnalyze(1, 1);
        let weakenScriptSize = ns.getScriptRam('weaken.js');
        let neededThreads = Math.ceil((currentSecurity - targetSecurity) / weakenEffect);
        let totalRamNeeded = weakenScriptSize * neededThreads;
        common.log(`Reducing ${server.hostname} to security level ${targetSecurity} will require ${neededThreads} threads, using ${totalRamNeeded}GB`);

        let runningThreads = 0;
        let runningHosts = 0;
        while (runningThreads < neededThreads) {
            let host = usableHosts.shift();
            if (host === undefined) {
                common.log(`Ran out of usable hosts at ${runningThreads} threads.`);
                break;
            }

            let ram = ns.getServerRam(host);
            let ramAvail = ram[0] - ram[1];
            let hostThreads = Math.floor(ramAvail / weakenScriptSize);
            common.log(`Server ${host} has ${ramAvail} RAM. Can run ${hostThreads} threads.`);

            if (hostThreads > 0) {
                ns.exec('weaken.js', host, hostThreads, '--target', args.target);
                runningThreads += hostThreads;
                runningHosts++;
            }
        }

        common.log(`Spawned ${runningThreads} threads of weaken across ${runningHosts} hosts. Awaiting completion.`)

        let awaitStart = new Date().getTime();
        while (runningHosts > 0) {
            if (runningHosts % 10 == 0 || new Date().getTime() - awaitStart > 30000) {
                common.log(`Awaiting ${runningHosts} hosts...`)
                awaitStart = new Date().getTime();
            }

            let data = await ns.readPort(common.ports.weakenTickets);
            if (data !== 'NULL PORT DATA') {
                runningHosts--;
            } else {
                await ns.asleep(10);
            }
        }
    }
}