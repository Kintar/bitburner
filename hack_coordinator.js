/** @param {NS} ns **/
import { initCommonObject } from 'common';

let common;
const argsSchema = [
    ['target', ''],
];

export async function main(ns) {
    common = initCommonObject(ns);
    const args = ns.flags(argsSchema);
    if (!args.target) {
        throw new Error('Must specify target.');
    }

    while (true) {
        let server = ns.getServer(args.target);
        let serverMap = common.getItem(common.keys.serverMap).servers;
        let targetMoney = server.moneyMax / 2;
        let currentMoney = ns.getServerMoneyAvailable(args.target);
        let currentSecurity = server.hackDifficulty;
        let maxDiff = server.minDifficulty + 5;

        common.log(`${args.target} currently holds ${ns.nFormat(currentMoney, '0,000,000.00')} available funds`);
        if (Math.abs(currentMoney - targetMoney) < 1000) {
            common.log('Completed hack phase.');
            ns.spawn('mainloop.js', 1);
        }

        if (currentSecurity > maxDiff) {
            common.log(`Security level of ${currentSecurity} is beyond threshold.`);
            common.log(`Returning to weaken phase.`);
            ns.spawn('coordinatedweaken.js', 1, '--target', args.target);
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

        let neededThreads = ns.hackAnalyzeThreads(args.target, targetMoney);
        let hackRam = ns.getScriptRam('hack.js');

        let runningThreads = 0;
        let runningHosts = 0;     
        common.log(`Hacking ${args.target} for ${ns.nFormat(targetMoney, '0,000,000.00')} will require ${neededThreads} threads.`);
        while (runningThreads < neededThreads) {
            let host = usableHosts.shift();
            if (host === undefined) {
                common.log(`Ran out of hosts at ${runningThreads} threads.`);
                break;
            }

            let ram = ns.getServerRam(host);
            let ramAvail = ram[0] - ram[1];
            let hostThreads = Math.floor(ramAvail / hackRam);
            common.log(`Server ${host} has ${ramAvail} RAM. Can run ${hostThreads} threads.`);

            if (hostThreads > 0) {
                ns.exec('hack.js', host, hostThreads, '--target', args.target);
                runningThreads += hostThreads;
                runningHosts++;
            }
        }

        common.log(`Spawned ${runningThreads} threads of hack across ${runningHosts} hosts. Awaiting completion.`)

        let awaitStart = new Date().getTime();
        while (runningHosts > 0) {
            if (runningHosts % 10 == 0 || new Date().getTime() - awaitStart > 30000) {
                common.log(`Awaiting ${runningHosts} hosts...`)
                awaitStart = new Date().getTime();
            }

            let data = await ns.readPort(common.ports.hackTickets);
            if (data !== 'NULL PORT DATA') {
                runningHosts--;
                common.log(`Host completed.`);
            } else {
                await ns.asleep(10);
            }
        }
    }
}