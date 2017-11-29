import fetch from "node-fetch";

async function lyraStyle(url, id) {
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

  for (const data of telem) {
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
        lyra.Vision[data.payload.Team === "Left" ? "Blue" : "Red"].push({
          Location: data.payload.Position,
          Name: data.payload.Ability,
        });
        break;
      default:
    }
  }
}

export default lyraStyle;
