import { generateHeroesStats }  from "~/transforms/global_heroes.js";
import Telemetry                from "~/transforms/telemetry.js";
import MatchesModel             from "~/models/vg_matches.js";

async function heroStats(match) {
  const heroes = {};

  for (const player of match.players) {
    heroes[player.actor] = generateHeroesStats(match, player);
  }
  const telem = await MatchesModel.getMatchTelemetry(match.telemetry.URL, match.id);

  for (const pick of telem.Draft) {
    if (pick.Type !== "HeroBan") continue;
    heroes[pick.Hero] = {
      bans: 1,
    };
  }
  const facts = telem.Facts;
  const factKeys = Object.keys(facts);
  for (const team of factKeys) {
    const teamKeys = Object.keys(facts[team]);
    for (const hero of teamKeys) {
      const actor = facts[team][hero];
      heroes[hero].TotalHealed = actor.TotalHealed;
      heroes[hero].TotalDealt = actor.TotalDealt;
      heroes[hero].abilityPattern = actor.Skill;
    }
  }

  return heroes;
}

export default heroStats;
