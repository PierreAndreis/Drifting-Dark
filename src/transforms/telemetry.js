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
    const blue = data.payload.Team === "Left";
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
        if (data.payload.Ability !== "Scout Trap" && data.payload.Ability !== "Flare") break;
        lyra.Vision[blue ? "Blue" : "Red"].push({
          Location: data.payload.Position,
          Name: data.payload.Ability,
        });
        break;
      case "BuyItem": {
        lyra.Facts[blue ? "Blue" : "Red"][hero].Items.push({
          Item: data.payload.Item,
          Time: `${Math.floor(difference / 60)}:${difference % 60}`,
        });
      }
        break;
      case "LearnAbility":
        lyra.Facts[blue ? "Blue" : "Red"][hero].Skill.push(dictionaries.cleanAbility(data.payload.Ability));
        break;
      case "DealDamage": {
        const heroData = lyra.Facts[blue ? "Blue" : "Red"][hero];
        const damage = heroData.Damage;
        const delt = heroData.Delt;
        const totalDamage = heroData.TotalDamage[target];
        const totalDelt = heroData.TotalDelt[target];
        if (!damage) lyra.Facts[blue ? "Blue" : "Red"][hero].Damage = 0;
        if (!delt) lyra.Facts[blue ? "Blue" : "Red"][hero].Delt = 0;
        if (!totalDamage) lyra.Facts[blue ? "Blue" : "Red"][hero].TotalDamage[target] = 0;
        if (!totalDelt) lyra.Facts[blue ? "Blue" : "Red"][hero].TotalDelt[target] = 0;
        lyra.Facts[blue ? "Blue" : "Red"][hero].Damage += data.payload.Damage;
        lyra.Facts[blue ? "Blue" : "Red"][hero].Delt += data.payload.Delt;
        lyra.Facts[blue ? "Blue" : "Red"][hero].TotalDamage[target] += data.payload.Damage;
        lyra.Facts[blue ? "Blue" : "Red"][hero].TotalDelt[target] += data.payload.Delt;
        break;
      }
      case "HealTarget": {
        const heroData = lyra.Facts[blue ? "Blue" : "Red"][hero];
        const targetActor = data.payload.TargetActor;
        const healed = heroData.Healed;
        const totalHealed = heroData.TotalHealed[targetActor];
        if (!healed) lyra.Facts[blue ? "Blue" : "Red"][hero].Healed = 0;
        if (!totalHealed) lyra.Facts[blue ? "Blue" : "Red"][hero].TotalHealed[targetActor] = 0;
        lyra.Facts[blue ? "Blue" : "Red"][hero].Healed += data.payload.Healed;
        lyra.Facts[blue ? "Blue" : "Red"][hero].TotalHealed[target] += data.payload.Healed;
        break;
      }
      case "KillActor":
        if (data.payload.TargetIsHero === 1) {
          const killer = hero === data.payload.Actor;
          lyra.Facts[blue ? "Blue" : "Red"][hero][killer ? "Kills" : "Deaths"].push({
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
