/** @param {NS} ns **/
export function initCommonObject(ns, requireHome = true) {
    ns.disableLog('ALL');
    if (requireHome) {
        if (ns.getHostname() !== 'home') {
            throw new Error('This script must be run from home');
        }
    }

    ns.tprint(`[${localeTimestamp()}] Started`);
    ns.print(`[${localeTimestamp()}] Started`);

    return {
        ns,
        getItem: function (key) {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : undefined;
        },
        setItem: function (key, value) {
            localStorage.setItem(key, JSON.stringify(value));
        },
        minSecurityLevelOffset: 2,
        maxMoneyMultiplier: 0.9,
        minSecurityWeight: 100,
        mapRefreshInterval: 60 * 60 * 1000, // One hour
        keys: {
            serverMap: "BB_SERVER_MAP",
            hackTarget: "BB_HACK_TARGET",
            action: "BB_ACTION",
        },
        ports: {
            weakenTickets: 1,
            growTickets: 2,
            hackTickets: 3,
        },
        hackPrograms: ['BruteSSH.exe', 'FTPCrack.exe', 'relaySMTP.exe', 'HTTPWorm.exe', 'SQLInject.exe'],
        log: function (msg) {
            const fullMsg = `[${localeTimestamp()}] ${msg}`;
            this.ns.print(fullMsg);
            this.ns.tprint(fullMsg);
        },
        getPlayerDetails: function () {
            let portHacks = 0;
            this.hackPrograms.forEach(prog => {
                if (this.ns.fileExists(prog, 'home')) {
                    portHacks++;
                }
            });

            return {
                hackingLevel: this.ns.getHackingLevel(),
                portHacks,
            }
        }
    }
}

export async function main(ns) {
    throw new Error(`${ns.getScriptName()} is a module, not an exectuable script`);
}

export function localeTimestamp(ms = 0) {
    if (!ms) {
        ms = new Date().getTime()
    }

    return new Date(ms).toLocaleTimeString()
}

export function estimateHackPercentage(hackDifficulty, requiredHackingSkill, hackingSkill) {
  const balanceFactor = 240;

  const difficultyMult = (100 - hackDifficulty) / 100;
  const skillMult = (hackingSkill - (requiredHackingSkill - 1)) / hackingSkill;
  const percentMoneyHacked = (difficultyMult * skillMult) / balanceFactor;
  if (percentMoneyHacked < 0) {
    return 0;
  }
  if (percentMoneyHacked > 1) {
    return 1;
  }

  return percentMoneyHacked;
}

/* Estimates BN1 hacking times, not taking any modifiers into account */
export function estimateHackingTime(requiredSkill, difficulty, playerSkill) {
  const difficultyMult = requiredSkill * difficulty;

  const baseDiff = 500;
  const baseSkill = 50;
  const diffFactor = 2.5;
  let skillFactor = diffFactor * difficultyMult + baseDiff;
  // tslint:disable-next-line
  skillFactor /= playerSkill + baseSkill;

  const hackTimeMultiplier = 5;
  const hackingTime =
    (hackTimeMultiplier * skillFactor);

  // Time is in seconds, so convert to ms
  return hackingTime * 1000;
}