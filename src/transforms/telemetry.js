import fetch from "node-fetch";
import { cleanAbility, cleanActor } from "~/resources/dictionaries";
import logger from "../lib/logger";

const NPC = [
  "*JungleMinion_TreeEnt*",
  "Unknown",
  "*TankMinion*",
  "*LeadMinion*",
  "*RangedMinion*",
  "*Petal",
  "*JungleMinion_ElderTreeEnt*",
  "*OuterTurret*",
  "*Kraken_Captured*",
  "*VainTurret*",
  "*VainCrystalAway*",
  "*Turret*",
  "*PetalMinion*",
];

 // TODO: Add gold miner, crystal miner, and kraken
const OBJECTIVES = [
  "*OuterTurret*",
  "*Turret*",
  "*VainTurret*",
  "*VainCrystalHome*",
  "*VainCrystalAway*",
]

class Telemetry {

  async json (url, id) {

    const result = await fetch(url, {
      timeout: 10000,
      compress: true
    });
    if (result.status !== 200) return {};

    let telemetry;

    try {
      telemetry = await result.json();
    }
    catch(e) {
      logger.warn(`Invalid Telemetry JSON: ${url}`);
      throw Error("InvalidJSON");
    }

    const res = {
      id,
      Draft: [],
      Facts: {
        Blue: {},
        Red: {},
      },
      Vision: {
        Blue: [],
        Red: [],
      },
    };

    const rawFactHero = () => {
      return {
        Healed: 0,
        TotalHealed: {},
        TotalDamage: {},
        TotalDealt: {},
        Skill: [],
        ObjectiveDamage: 0,
        Damage: 0,
        Dealt: 0,
      }
    }

    const startTime = Date.parse(telemetry[0].time);
    
    for (const data of telemetry) {
      // Find the difference between the current event and startTime which will be time of the match in game
      const difference = Date.parse(data.time) - startTime;
      const { payload } = data;
      const team = payload.Team === "Left" || payload.Team === "1" ? "Blue" : "Red";

      // If the actors are objects and not heroes continue to the next loop
      if (payload.isHero === 0 || NPC.includes(payload.Actor)) {
        continue;
      };

      let hero = (payload.Actor && payload.IsHero !== 0) && cleanActor(payload.Actor);
      // if (!hero && payload.Hero) hero = cleanActor(payload.Hero)
      // else continue;

      if (payload.Target && payload.TargetIsHero === 1) payload.Target = cleanActor(payload.Target);
      if (payload.TargetActor && payload.TargetIsHero === 1) payload.TargetActor = cleanActor(payload.TargetActor);

      const target = payload.Target;
      let draft = res.Draft;

      // If this heroes doesnt exist in the object above create the base for the hero
      if (hero && !res.Facts[team][hero]) {
        res.Facts[team][hero] = rawFactHero();
      }

      let factHero = res.Facts[team][hero];

      switch (data.type) {
        case "HeroBan":
        case "HeroSelect":
          draft.push({
            Type: data.type,
            Hero: cleanActor(payload.Hero),
            Team: payload.Team,
          });
          break;

        case "UseItemAbility":
          switch (payload.Ability) {
            case "Scout Trap":
            case "Flare":
            case "Contraption":
            case "Flaregun":
              res.Vision[team].push({
                Location: payload.Position,
                Name: payload.Ability,
              });
              break;
            default:
          }
          break;

        case "BuyItem":
          // If items doesnt already exist in object for this hero then create it first
          if (!factHero.Items) factHero.Items = [];
          // Find the minutes
          const minutes = Math.floor(difference / 1000 / 60);
          // Find the seconds
          const seconds = (difference / 1000) % 60;
          factHero.Items.push({
            Item: payload.Item,
            // If the value is like 5 minutes change it to look like 05: so it looks nicer with the 0
            Time: `${minutes > 9 ? minutes : `0${minutes}`}:${seconds > 9 ? seconds : `0${seconds}`}`,
          });
          break;
          
        case "LearnAbility":
          const ability = cleanAbility(payload.Ability);
          factHero.Skill.push(ability);
          break;

        case "DealDamage":


          if (OBJECTIVES.includes(payload.Target)) {
            factHero.ObjectiveDamage += payload.Dealt;
          }
          else if (payload.TargetIsHero === 1){
            factHero["Damage"] += payload["Damage"];
            factHero["Dealt"] += payload["Dealt"];

            if (!factHero.TotalDamage[target]) {
              factHero.TotalDamage[target] = 0;
              factHero.TotalDealt[target] = 0;
            }

            factHero["TotalDamage"][target] += payload["Damage"];
            factHero["TotalDealt"][target] += payload["Dealt"];
          }
          break;

        case "HealTarget": {
          if (payload.IsHero !== 1) continue;
          const { TargetActor, Healed } = payload;
          factHero.Healed += Healed;
          if (isNaN(factHero.TotalHealed[TargetActor])) factHero.TotalHealed[TargetActor] = Healed;
          else factHero.TotalHealed[TargetActor] += Healed;
          break;
        }

        case "KillActor":
          if (payload.TargetIsHero !== 1) continue;
          const killer = hero === payload.Actor ? "Kills" : "Deaths";
          if (!factHero[killer]) factHero[killer] = [];
          factHero[killer].push({
            Actor: killer ? cleanActor(payload.Killed) : hero,
            Time: `${Math.floor(difference / 60)}:${difference % 60}`,
            Gold: payload.Gold,
            Position: payload.Position,
          });
          break;

        default:
      }
    }
    return res;

  }
}

// export default jsonStyle;
export default new Telemetry().json;
