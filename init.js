/** @param {NS} ns **/
export async function main(ns) {
  if (ns.getHostname() !== "home") {
    throw new Exception("Run the script from home");
  }

  await ns.wget(
    `https://raw.githubusercontent.com/kintar/bitburner/main/git-pull.js?ts=${new Date().getTime()}`,
    "git-pull.js"
  );

  ns.spawn("git-pull.js", 1);
}