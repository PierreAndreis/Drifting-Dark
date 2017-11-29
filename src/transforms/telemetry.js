import fetch from "node-fetch";
import dictionaries from "~/resources/dictionaries";

async function lyraStyle(url, id, duration) {
  const telem = await fetch(url)
    .then(result => result.json()).then(json => json);
  console.log(telem);

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
    if (data === telem[0]) startTime = data.time;
    const difference = startTime - Date.parse(data.time);
    const team = data.payload.Team === "Left" ? "Blue" : "Red";
    const hero = data.payload.Actor;
    const target = data.payload.Target;
    switch (data.type) {
      case "HeroBan":
      case "HeroSelect":
        lyra.Draft.push({
          Type: data.type,
          Hero: data.payload.Hero,
          Team: data.payload.Team,
        });
        break;
      case "UseItemAbility":
        if (data.payload.Ability !== "Scout Trap" && data.payload.Ability !== "Flare" && data.payload.Ability !== "Contraption" && data.payload.Ability !== "Flaregun") break;
        lyra.Vision[team].push({
          Location: data.payload.Position,
          Name: data.payload.Ability,
        });
        break;
      case "BuyItem": {
        lyra.Facts[team][hero].Items.push({
          Item: data.payload.Item,
          Time: `${Math.floor(difference / 60)}:${difference % 60}`,
        });
      }
        break;
      case "LearnAbility":
        lyra.Facts[team][hero].Skill.push(dictionaries.cleanAbility(data.payload.Ability));
        break;
      case "DealDamage": {
        const heroData = lyra.Facts[team][hero];
        const damage = heroData.Damage;
        const delt = heroData.Delt;
        const totalDamage = heroData.TotalDamage[target];
        const totalDelt = heroData.TotalDelt[target];
        const objDmg = heroData.ObjectiveDamage[target];
        if (!damage) lyra.Facts[team][hero].Damage = 0;
        if (!delt) lyra.Facts[team][hero].Delt = 0;
        if (!totalDamage) lyra.Facts[team][hero].TotalDamage[target] = 0;
        if (!totalDelt) lyra.Facts[team][hero].TotalDelt[target] = 0;
        if (!objDmg) lyra.Facts[team][hero].ObjectiveDamage[target] = 0;
        lyra.Facts[team][hero].Damage += data.payload.Damage;
        lyra.Facts[team][hero].Delt += data.payload.Delt;
        lyra.Facts[team][hero].TotalDamage[target] += data.payload.Damage;
        lyra.Facts[team][hero].TotalDelt[target] += data.payload.Delt;
        switch (data.payload.Target) {
          case "*OuterTurret*":
          case "*Turret*":
          case "*VainTurret*":
          case "*VainCrystalHome*":
          case "*VainCrystalAway*":
            // TODO: Add gold miner, crystal miner, and kraken
            lyra.Facts[team][hero].ObjectiveDamage[target] += data.payload.Delt;

            break;
          default:
        }
      }
        break;
      case "HealTarget": {
        const heroData = lyra.Facts[team][hero];
        const targetActor = data.payload.TargetActor;
        const healed = heroData.Healed;
        const totalHealed = heroData.TotalHealed[targetActor];
        if (!healed) lyra.Facts[team][hero].Healed = 0;
        if (!totalHealed) lyra.Facts[team][hero].TotalHealed[targetActor] = 0;
        lyra.Facts[team][hero].Healed += data.payload.Healed;
        lyra.Facts[team][hero].TotalHealed[target] += data.payload.Healed;
        break;
      }
      case "KillActor":
        if (data.payload.TargetIsHero === 1) {
          const killer = hero === data.payload.Actor;
          lyra.Facts[team][hero][killer ? "Kills" : "Deaths"].push({
            Actor: killer ? data.payload.Killed : data.payload.Actor,
            Time: `${Math.floor(difference / 60)}:${difference % 60}`,
            Gold: data.payload.Gold,
            Position: data.payload.Position,
          });
        }
        break;

      default:
    }
  }
}

export default lyraStyle;
