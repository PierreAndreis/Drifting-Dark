import fetch from "node-fetch";
import { cleanAbility } from "~/resources/dictionaries";

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

    const result = await fetch(url);
    if (result.status !== 200) return {};
    const telemetry = await result.json();

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
      const team = payload.Team === "Left" ? "Blue" : "Red";
      const hero = payload.Actor;
      // If the actors are objects and not heroes continue to the next loop
      if (payload.isHero === 0 || NPC.includes(hero)) {
        continue;
      };

      const target = payload.Target;

      let draft = res.Draft;

      // If this heroes doesnt exist in the object above create the base for the hero
      if (!res.Facts[team][hero]) {
        res.Facts[team][hero] = rawFactHero();
      }

      let factHero = res.Facts[team][hero];

      switch (data.type) {
        case "HeroBan":
        case "HeroSelect":
          draft.push({
            Type: data.type,
            Hero: payload.Hero,
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
          else {
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
          const { TargetActor } = payload;
          factHero.Healed += payload.Healed;
          if (isNaN(factHero.TotalHealed[TargetActor])) factHero.TotalHealed[TargetActor] = payload.Healed;
          else factHero.TotalHealed[TargetActor] += payload.Healed;
          break;
        }

        case "KillActor":
          if (payload.TargetIsHero === 1) {
            const killer = hero === payload.Actor ? "Kills" : "Deaths";
            if (!factHero[killer]) factHero[killer] = [];
            factHero[killer].push({
              Actor: killer ? payload.Killed : hero,
              Time: `${Math.floor(difference / 60)}:${difference % 60}`,
              Gold: payload.Gold,
              Position: payload.Position,
            });
          }
          break;

        default:
      }
    }
    return res;

  }
}

// export default jsonStyle;
export default new Telemetry().json;
