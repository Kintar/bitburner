/**
 * Small script to run hack on a target after an optional delay, then return a ticket to a specific port
 */

const argsSchema = [
    ['target', ''],
    ['delay', 0]
];

import { initCommonObject } from './common';

/** @param {NS} ns **/
export async function main(ns) {
    const common = initCommonObject(ns, false);
    ns.enableLog('hack');
    const args = ns.flags(argsSchema);
    if (args.target == '') {
        throw new Error('--target is required to run this script');
    }
    await ns.asleep(args.delay);
    const expected = ns.getHackTime(args.target);
    const start = new Date().getTime();
    await ns.hack(args.target);
    const actual = new Date().getTime() - start;
    ns.print(`Expected time: ${ns.nFormat(expected, '0.00').padStart(15,' ')}ms.`);
    ns.print(`  Actual time: ${ns.nFormat(actual, '0.00').padStart(15,' ')}ms.`)
    while (!await ns.tryWritePort(common.ports.hackTickets, ns.getHostname())) {
        await ns.asleep(10);
    }
}