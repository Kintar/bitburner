/** @param {NS} ns **/
import { initCommonObject } from 'common';

export async function main(ns) {
    const common = initCommonObject(ns);
    common.setItem(common.keys.serverMap, null);
}