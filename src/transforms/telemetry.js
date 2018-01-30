import fetch from "node-fetch";
import { cleanAbility, cleanActor } from "~/resources/dictionaries";
import { getRate } from "~/lib/utils_stats";
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

const HEALS_TO_SKIP = [
  "Buff_SpawnStage_RechargeAndAlwaysSpeedBoost",
  "Buff_Ace",
]

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
      // logger.warn(`Invalid Telemetry JSON: ${url}`, e);
      throw Error("InvalidJSON");
    }

    let res = {
      id,
      draft: [],
      facts: {
        blue: {},
        red: {},
      },
      vision: {
        blue: [],
        red: [],
      },
    };

    const rawFactHero = () => {
      return {
        healed: 0,
        totalHealed: {},
        totalDamage: {},
        totalDealt: {},
        skill: [],
        objectiveDamage: 0,
        damage: 0,
        dealt: 0,
        taken: 0,
      }
    }

    let startGame = telemetry.find((t) => t.type === "BuyItem");
    if (!startGame) telemetry.find((t) => t.type === "LevelUp");

    const startTime = Date.parse(startGame.time);
    
    for (const data of telemetry) {
      // Find the difference between the current event and startTime which will be time of the match in game
      const difference = Date.parse(data.time) - startTime;
      const { payload } = data;
      const team = payload.Team === "Left" || payload.Team === "1" ? "blue" : "red";

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
      let draft = res.draft;

      // If this heroes doesnt exist in the object above create the base for the hero
      if (hero && !res.facts[team][hero]) {
        res.facts[team][hero] = rawFactHero();
      }

      let factHero = res.facts[team][hero];

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
              res.vision[team].push({
                Location: payload.Position,
                Name: payload.Ability,
              });
              break;
            default:
          }
          break;

        case "BuyItem":
          // If items doesnt already exist in object for this hero then create it first
          if (!factHero.items) factHero.items = [];
          if (payload.Item === "Candy - Taunt") break;
          // Find the minutes
          const minutes = Math.floor(difference / 1000 / 60);
          // Find the seconds
          const seconds = (difference / 1000) % 60;
          factHero.items.push({
            Item: payload.Item,
            // If the value is like 5 minutes change it to look like 05: so it looks nicer with the 0
            Time: `${minutes > 9 ? minutes : `0${minutes}`}:${seconds > 9 ? seconds : `0${seconds}`}`,
          });
          break;
          
        case "LearnAbility":
          const ability = cleanAbility(payload.Ability);
          factHero.skill.push(ability);
          break;

        case "DealDamage":

          if (OBJECTIVES.includes(payload.Target)) {
            factHero.objDamage += payload.Dealt;
          }
          else if (payload.TargetIsHero === 1){
            factHero.damage += payload.Damage;
            factHero.dealt += payload.Dealt;

            if (!factHero.totalDamage[target]) {
              factHero.totalDamage[target] = 0;
              factHero.totalDealt[target] = 0;
            }

            // Damage Taken

            const enemyTeam = payload.Team !== "Left" ? "blue" : "red";
            if (!res.facts[enemyTeam][target]) res.facts[enemyTeam][target] = rawFactHero();
            res.facts[enemyTeam][target].taken += payload.Dealt;
            
            factHero.totalDamage[target] += payload.Damage;
            factHero.totalDealt[target] += payload.Dealt;
          }
          break;

        case "HealTarget": {
          if (payload.IsHero !== 1 || payload.TargetIsHero !== 1) continue;

          if (HEALS_TO_SKIP.includes(payload.Source)) continue;
          if (payload.Team !== payload.TargetTeam) continue;

          const { TargetActor, Healed } = payload;
          factHero.healed += Healed;

          if (isNaN(factHero.totalHealed[TargetActor])) factHero.totalHealed[TargetActor] = Healed;
          else factHero.totalHealed[TargetActor] += Healed;
          
          break;
        }

        case "Vampirism": {
          if (payload.IsHero !== 1 || payload.TargetIsHero !== 1) continue;
          if (HEALS_TO_SKIP.includes(payload.Source)) continue;

          const { TargetActor, Vamp } = payload;
          const Healed = Number(Vamp);
          factHero.healed += Healed;

          if (isNaN(factHero.totalHealed[TargetActor])) factHero.totalHealed[TargetActor] = Healed;
          else factHero.totalHealed[TargetActor] += Healed;
          
          break;
        }

        case "KillActor":
          if (payload.TargetIsHero !== 1) continue;
          const typeOfKill = hero === payload.Actor ? "kills" : "deaths";
          if (!factHero[typeOfKill]) factHero[typeOfKill] = [];
          factHero[typeOfKill].push({
            Actor: typeOfKill ? cleanActor(payload.Killed) : hero,
            Time: `${Math.floor(difference / 60)}:${difference % 60}`,
            Gold: payload.Gold,
            Position: payload.Position,
          });
          break;

        default:
      }
    }

    let highestDamage = 0;
    let highestHealing = 0;
    let highestTaken = 0;
    
    for (let x in res.facts) {
      for (let i in res.facts[x]) {
        const p = res.facts[x][i]
        highestDamage = Math.max(highestDamage, p.dealt);
        highestHealing = Math.max(highestHealing, p.healed);
        highestTaken    = Math.max(highestTaken, p.taken);
      }
    }

    for (let x in res.facts) {
      for (let i in res.facts[x]) {
        const p = res.facts[x][i];
        p.damageShare  = getRate(p.dealt, highestDamage);
        p.takenShare   = getRate(p.taken, highestTaken);
        p.healingShare = getRate(p.healed, highestHealing);
      }
    }
    

    return res;

  }
}

// export default jsonStyle;
export default new Telemetry().json;
