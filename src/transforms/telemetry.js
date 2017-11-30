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
  const startTime = Date.parse(telem[0].time);

  for (const data of telem) {
    const difference = Date.parse(data.time) - startTime;
    const { payload } = data;
    const team = payload.Team === "Left" ? "Blue" : "Red";
    const hero = payload.Actor;
    const target = payload.Target;
    const factHero = lyra.Facts[team][hero];
    if (data.type === "HealTarget") console.log(factHero ? "true" : "false");
    if (!factHero) {
      lyra.Facts[team][hero] = {
        Healed: 0,
        TotalHealed: {},
        TotalDamage: {},
        TotalDealt: {},
        ObjectiveDamage: 0,
        Damage: 0,
        Dealt: 0,
      };
    }
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
        const minutes = Math.floor(difference / 1000 / 60);
        const seconds = (difference / 1000) % 60;
        lyra.Facts[team][hero].Items.push({
          Item: payload.Item,
          Time: `${minutes > 9 ? minutes : `0${minutes}`}:${seconds > 9 ? seconds : `0${seconds}`}`,
        });
        break;
      case "LearnAbility":
        if (!factHero.Skill) lyra.Facts[team][hero].Skill = [];
        lyra.Facts[team][hero].Skill.push(dictionaries.cleanAbility(payload.Ability));
        break;
      case "DealDamage": {
        if (!factHero.TotalDamage[target]) {
          lyra.Facts[team][hero].TotalDamage[target] = 0;
          lyra.Facts[team][hero].TotalDealt[target] = 0;
        }
        const properties = ["Damage", "Dealt", "TotalDamage", "TotalDealt"];
        for (const prop of properties) {
          switch (prop) {
            case "Damage":
            case "Dealt":
              lyra.Facts[team][hero][prop] += payload[prop];
              break;
            case "TotalDamage":
            case "TotalDealt":
              lyra.Facts[team][hero][prop][target] += payload[prop === "TotalDamage" ? "Damage" : "Dealt"];
              break;
            default:
          }
        }
        switch (payload.Target) {
          case "*OuterTurret*":
          case "*Turret*":
          case "*VainTurret*":
          case "*VainCrystalHome*":
          case "*VainCrystalAway*":
            // TODO: Add gold miner, crystal miner, and kraken
            lyra.Facts[team][hero].ObjectiveDamage += payload.Dealt;
            break;
          default:
        }
      }
        break;
      case "HealTarget": {
        const { TargetActor } = payload;
        // if (!factHero) {
        //   console.log(lyra.Facts[team][hero]);
        //   console.log('=========')
        //     console.log(lyra.Facts[team]);
        //
        // }
          if (!factHero) console.log('failed')
        console.log(lyra.Facts[team][hero].TotalHealed);
        if (!factHero.TotalHealed[TargetActor]) {
          lyra.Facts[team][hero].TotalHealed[TargetActor] = 0;
        }
        lyra.Facts[team][hero].Healed += payload.Healed;
        lyra.Facts[team][hero].TotalHealed[TargetActor] += payload.Healed;
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
