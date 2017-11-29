import fetch from "node-fetch";
import dictionaries from "~/resources/dictionaries";

async function lyraStyle(url, id) {
  const telem = await fetch(url)
    .then(result => result.json()).then(json => json);

  const lyra = {
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
  let startTime;

  for (const data of telem) {
    if (data === telem[0]) startTime = Date.parse(data.time);
    const difference = startTime - Date.parse(data.time);
    const { payload } = data;
    const team = payload.Team === "Left" ? "Blue" : "Red";
    const hero = payload.Actor;
    const target = payload.Target;
    const factHero = lyra.Facts[team][hero];
    if (!factHero.Healed) {
      lyra.Facts[team][hero] = {
        Healed: 0,
        TotalHealed: {},
        TotalDamage: {},
        TotalDelt: {},
        ObjectiveDamage: 0,
        Damage: 0,
        Delt: 0,
      };
    }
    if (!factHero) lyra.Facts[team][hero] = [];
    switch (data.type) {
      case "HeroBan":
      case "HeroSelect":
        lyra.Draft.push({
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
            lyra.Vision[team].push({
              Location: payload.Position,
              Name: payload.Ability,
            });
            break;
          default:
        }
        break;
      case "BuyItem":
        if (!factHero.Items) lyra.Facts[team][hero].Items = [];
        lyra.Facts[team][hero].Items.push({
          Item: payload.Item,
          Time: `${Math.floor(difference / 60)}:${difference % 60}`,
        });
        break;
      case "LearnAbility":
        if (!factHero.Skill) lyra.Facts[team][hero].Skill = [];
        lyra.Facts[team][hero].Skill.push(dictionaries.cleanAbility(payload.Ability));
        break;
      case "DealDamage": {
        if (!factHero.TotalDamage[target]) {
          lyra.Facts[team][hero].TotalDamage[target] = 0;
          lyra.Facts[team][hero].TotalDelt[target] = 0;
        }
        const properties = ["Damage", "Delt", "TotalDamage", "TotalDelt"];
        for (const prop of properties) {
          lyra.Facts[team][hero][prop] += payload[prop];
        }
        switch (payload.Target) {
          case "*OuterTurret*":
          case "*Turret*":
          case "*VainTurret*":
          case "*VainCrystalHome*":
          case "*VainCrystalAway*":
            // TODO: Add gold miner, crystal miner, and kraken
            lyra.Facts[team][hero].ObjectiveDamage += payload.Delt;
            break;
          default:
        }
      }
        break;
      case "HealTarget": {
        const { TargetActor } = payload;

        const totalHealed = factHero.TotalHealed[TargetActor];
        if (!totalHealed) lyra.Facts[team][hero].TotalHealed[TargetActor] = 0;
        const properties = ["Healed", "TotalHealed"];
        for (const prop of properties) {
          lyra.Facts[team][hero][prop] += payload[prop];
        }
        break;
      }
      case "KillActor":
        if (payload.TargetIsHero === 1) {
          const killer = hero === payload.Actor ? "Kills" : "Deaths";
          if (!factHero[killer]) lyra.Facts[team][hero][killer] = [];
          lyra.Facts[team][hero][killer].push({
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
  return lyra;
}

export default lyraStyle;
