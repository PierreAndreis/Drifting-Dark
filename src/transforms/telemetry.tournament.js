/** THIS NEEDS TO BE REDONE
 * 
 *  TOO MUCH LOOPS GOING ON HERE
 */

import * as lodash   from "lodash";
import { merge, GETSEASON }     from "~/utils/utils";

const PROFILING = true;

const heroTokensWithMisleadingNames = {
  /* Hero009 */ "*Hero009*"   : "Krul",
  /* Hero010 */ "*Hero010*"   : "Skaarf",
  /* Hero011 */ "*Sayoc*"     : "Taka",
  /* Hero016 */ "*Hero016*"   : "Rona",
};

function teamNametoTelemetryToken(team) {
  return {
    "right/red": "Right",
    "left/blue": "Left",
  }[team] || team;
}

function checkName(name) {
  // Small fix for LoneDelphi nme during live finals summer 07
  // To maintain his old stats
  if (name === "LoneDeIphi") {
    return "LoneDelphi";
  }

  if (name === "hundor") {
    return "Hundor";
  }
  return name;
}

function heroNameFromToken(token) {
  
  // Returns the hero name, given a token.
  //
  // For "*Hero009*", etc., returns "Krul", using heroTokensWithMisleadingNames look-up table.

  let match;

  match = /^\*(.*)\*$/.exec(token);
  if (match) return (heroTokensWithMisleadingNames[token] || match[1]);

  match = /^([^_]*)_/.exec(token);
  if (match) return match[1];

  return false;
  };

// Thank you Nathan!
// https://github.com/nathancarter/vg-match-analysis/blob/master/harvesters/builds.litcoffee
const TRACKED_ITEMS = new Set([
    "Sorrowblade",
    "Shatterglass",
    "Tornado Trigger",
    "Metal Jacket",
    "Clockwork",
    "Serpent Mask",
    "Tension Bow",
    "Bonesaw",
    "Shiversteel",
    "Frostburn",
    "Fountain of Renewal",
    "Crucible",
    "Journey Boots",
    "Tyrant\'s Monocle",
    "Aftershock",
    "Broken Myth",
    "War Treads",
    "Atlas Pauldron",
    "Aegis",
    "Breaking Point",
    "Alternating Current",
    "Eve of Harvest",
    "Contraption",
    "Halcyon Chargers",
    "Stormcrown",
    "Poisoned Shiv",
    "Nullwave Gauntlet",
    "Echo",
    "Slumbering Husk",
    "Spellsword"
]);


export default async function TourneyTeam (match, season) {

  const rosters = match.rosters;

  const stats = {};

  if (PROFILING) console.time('request telemetry');
  const telemetry = await getTelemetry(match);
  if (PROFILING) console.timeEnd('request telemetry');
  if (PROFILING) console.time('calculate stats');

  lodash.forEach(rosters, (roster) =>  lodash.forEach(roster.participants, (participant) => {

      const team = checkTeam(checkName(participant.player.name), season);
       
      if (!team[0]) return;
      
      const team_stats = generateTeamStats(match, roster, participant, telemetry);

      if (!stats[team[0].name]) {
        stats[team[0].name] = {
          currentSeason: season.name,    
          team:          team[0].name,
          region:        team[0].region,
          lastMatch:     match.createdAt,
          Stats:         team_stats,
          Players: {},
        };
      }

      const player_stats = generateGeneralStats(match, roster, participant, telemetry);
      
      stats[team[0].name]["Players"][checkName(participant.player.name)] = player_stats;

  }));

  if (PROFILING) console.timeEnd('calculate stats');
  return stats;

}

function checkTeam(player, season) {

  const transmogrify = (str) => {
    return str.toLowerCase().replace(/ /g, "");
  };

  player = transmogrify(player);

  const team = lodash.filter(season.teams, (t) => {
    t.name   = transmogrify(t.name);
    const _t = transmogrify(JSON.stringify(t.players));
    if (_t.indexOf(player) >= 0) return t;
  });

  return team;
}

function telemetryFilter(telemetry, team, actor) {

  const startTime = telemetry[0].time;

  team = teamNametoTelemetryToken(team);

  return lodash.filter(telemetry, (t) => {
    if (actor) {
      if ( t.payload.Team  === team
        && t.payload.Actor === actor ) return t;
    }
    else {
      if (t.payload.Team  === team ) return t;
    }
  })
}

async function getTelemetry(match) {
  try {
    const telemetry = await match.assets[0].resolve();


    // Without counting Draft, we will get the first actual in-game start Time
    const startTime = new Date(
      lodash.filter(telemetry, (t) => {
        if (t.type === "PlayerFirstSpawn") return t;
      })[0].time
    );

    return lodash.map(telemetry, (t) => {
      t.seconds = (new Date(t.time) - startTime) / 1000;
      return t;
    });
  } 
  catch (e) {

    console.log("Telemetry Error:", e);
    throw new Error (e);
  }


}

function calcBuildTime(heroTelemetry, item = false) {

  const checkItem = (i) => {
    if  (!item) return TRACKED_ITEMS.has(i);
    else        return (i === item) ? true : false;
  }
  
  const buildTime = lodash.filter(heroTelemetry, (t) => {
    if (  t.type === "BuyItem"
        && checkItem(t.payload.Item)
       ) return t;
  });

  return (buildTime[0]) ? buildTime[0].seconds : 0;
}

function calcKills(heroTelemetry) {

  const gracePeriod = 10;

  let time           = heroTelemetry[0].seconds;
  let endTime        = heroTelemetry.pop().seconds;
  let indexesCounted = new Set ([]);

  let double = 0;
  let triple = 0;

  const range = (start, end) =>  lodash.filter(heroTelemetry, (t, i) => {
      if (    t.seconds >= start
          &&  t.seconds <= end
          &&  t.type === "KillActor"
          &&  t.payload.TargetIsHero
          &&  !indexesCounted.has(i)
         ) {
            indexesCounted.add(i);
            return t;
          }
  });

  lodash.forEach(heroTelemetry, (t) => {
    
    if (    t.type !== "KillActor"
        || !t.payload.TargetIsHero) return;
    
    const start = t.seconds;
    const end   = t.seconds + gracePeriod;
    const kills = range(start, end);

         if (kills.length === 2)  double++;
    else if (kills.length === 3)  triple++;

  });

  return {double, triple};


}

function calcReflexRate(heroTelemetry) {
  const blocks_item = []
}

function gotFirstBlood(heroTelemetry) {

}

function calculateTeamFirsts(teamSide, telemetry) {

  const realSide = teamNametoTelemetryToken(teamSide);

  let tower = -1;
  let blood = -1;

  lodash.forEach(telemetry, (t) => {

    if (tower > -1 && blood > -1) return false;

    if (t.type === "GoldFromTowerKill") {
      if (t.payload.Team === realSide) {
        tower = t.seconds;
      }
      else {
        tower = 0;
      }
    }
    else if (
       t.type                 === "KillActor"
    && t.payload.IsHero       === 1
    && t.payload.TargetIsHero === 1 ) {
      if (t.payload.Team === realSide) {
        blood = t.seconds;
      }
      else {
        blood = 0;
      }
    }
  })

  tower = (tower === -1) ? 0 : tower;
  blood = (blood === -1) ? 0 : blood;
  
  return {blood, tower}

}

function calculateKrakenStats(teamTelemetry, enemyTelemetry) {
  
  const lastSecond = teamTelemetry[teamTelemetry.length - 1].seconds;
  // return teamTelemetry;
  const KrakenCaptures = lodash.filter(teamTelemetry, (t) => {
    if (   t.type          === "KillActor"
        && t.payload.Killed     === "*Kraken_Jungle*"
        && t.payload.KilledTeam === "Neutral") return t;

  });
  // grab index, loop until kraken captured is killed
  // grab all turretgoldfromtowerkills in between

  const KrakenDies = lodash.filter(enemyTelemetry, (e) => {
    if (    e.type               === "KillActor"
         && e.payload.Killed     === "*Kraken_Captured*" ) return e;
  });

  let KrakenTurrets = [];
  let i = 0;

  for (let i in KrakenCaptures) {
    const cap = KrakenCaptures[i].seconds;
    const die = (KrakenDies[i]) ? KrakenDies[i].seconds : lastSecond;

    const kc = lodash.filter(teamTelemetry, (t) => {

      if (t.type === "GoldFromTowerKill"
          && t.seconds > cap
          && t.seconds < die ) return t;

    });
    // We divide by 3 because there are 3 players, 
    // and each player gets GoldFromTowerKill so we need to 
    // count 3 as 1
    if (kc.length > 0) KrakenTurrets.push((kc.length / 3));
    
  }

  return KrakenTurrets;

}

function calculateJungleCamps(actor, side, telemetry) {

  const mySide = teamNametoTelemetryToken(side);

  // Jungle killed in my jungle by enemy
  let   goldLost = 0;
  let jungleLost = 0;

 // Jungle I killed on enemy jungle
  let jungleStolen = 0;
  let   goldStolen = 0;

  // Elder I captured
  let elderCaptures = 0;
  let elderGold     = 0;

  // Elder captured by enemy
  let elderLost     = 0;
  let elderGoldLost = 0;

  const belongsToMe = (position) => {
    if (position[0] > 0 && mySide === "Left") return true;
    if (position[0] < 0 && mySide === "Right") return true;
    return false;
  }

  const itWasMe = (s, a) => {
    if (mySide === s && actor === a);
  }

  lodash.forEach(telemetry, (t) => {
    if (t.type === "KillActor" &&
        /Jungle/.test(t.payload.Killed)) {
      
      t.payload.Gold = parseInt(t.payload.Gold);
      const isMine = belongsToMe(t.payload.Position);
      const itWasMyTeam = (mySide === t.payload.Team);
      const itWasMe = (mySide === t.payload.Team && actor === t.payload.Actor);
      const actorIsElder = (t.payload.Killed === "*JungleMinion_ElderTreeEnt*");

      if (isMine && !itWasMyTeam && !actorIsElder) {
        // If it is mine, it wasn't my team who killed and it is not Elder
        jungleLost++;
        goldLost += t.payload.Gold;
      } else if (!isMine && itWasMe && !actorIsElder) {
        // If it is not mine, it was me who killed, and it is not Elder
        jungleStolen++;
        goldStolen += t.payload.Gold;
      } else if (itWasMe && actorIsElder) {
        // If it was me who killed Elder
        elderCaptures++;
        elderGold += t.payload.Gold;
      } else if (!itWasMe && !itWasMyTeam && actorIsElder) {
        // If it wasn't me or my team who killed Elder
        elderLost++;
        elderGoldLost += t.payload.Gold;
      }
    };
  });

  return {
    goldLost,
    jungleLost,
    jungleStolen,
    goldStolen,
    elderCaptures,
    elderGold,
    elderLost,
    elderGoldLost,
  }
}

function calculateDamage(actor, side, telemetry) {
  const mySide = teamNametoTelemetryToken(side);

  let done = 0;
  let received = 0;

  lodash.forEach(telemetry, (t) => {
    if (t.type === "DealDamage" && t.payload.TargetIsHero === 1 && t.payload.IsHero === 1) {
      if (t.payload.Actor === actor && t.payload.Team === mySide) {
        done += t.payload.Delt;
      } else if (t.payload.Target === actor && t.payload.Team !== mySide) {
        received += t.payload.Delt;
      }
    }
  });

  return {done,received};

}

function generateTeamStats(match, roster, participant, telemetry) {

  const hero   = participant.actor;
  const r      = roster.stats;
  const winner = (participant.data.attributes.stats.winner) ? 1 : 0;

  const first = calculateTeamFirsts(r.side, telemetry);

  let kills          = 0;
  let deaths         = 0;
  let assists        = 0;
  let krakenCaptures = 0;
  const heroes  = {};
  

  lodash.forEach(roster.participants, (_p) => {

    const p = _p.data.attributes;
    kills   += p.stats.kills;
    deaths  += p.stats.deaths;
    assists += p.stats.assists;

    if (p.stats.krakenCaptures > krakenCaptures) krakenCaptures = p.stats.krakenCaptures;

    heroes[heroNameFromToken(p.actor)] = {
      hero:     heroNameFromToken(p.actor),
      wins:     (p.stats.winner) ? 1 : 0,
      games:    1,
      kills:    p.stats.kills,
      deaths:   p.stats.deaths,
      assists:  p.stats.kills,
      duration: p.stats.duration,
    };
  })

  const stats = {
    wins:            winner,
    games:           1,
    duration:        match.duration,
    durationWin:     (winner) ? match.duration : 0,
    kills:           kills,
    deaths:          deaths,
    assists:         assists,
    farm:            r.farm,
    aces:            r.acesEarned,
    turrets:         r.turretKills,
    krakenCaptures:  krakenCaptures,
    firstBlood:      (!!first.blood) ? 1 : 0,
    firstTurret:     (!!first.tower) ? 1 : 0,
    firstBloodTime:  first.blood,
    firstTurretTime: first.tower,
    Heroes:          heroes,

  };

  return stats;

}

function generateGeneralStats(match, roster, participant, telemetry) {

  if (PROFILING) console.time(`${participant._actor} stats`);
  const enemySide = (roster.stats.side === "right/red") ? "left/blue" : "right/red";
  
  const heroTelemetry = telemetryFilter(telemetry, roster.stats.side, participant._actor);

  const  teamTelemetry = telemetryFilter(telemetry, roster.stats.side);
  const enemyTelemetry = telemetryFilter(telemetry, enemySide);

  const buildTime    = calcBuildTime(heroTelemetry);
  const fountainTime = calcBuildTime(heroTelemetry, "Fountain of Renewal");

  const kS           = calcKills(heroTelemetry);

  const tripleKills  = kS.triple;
  const doubleKills  = kS.double;

  const jungleCamp = calculateJungleCamps(participant._actor, roster.stats.side, telemetry);

  const damage = calculateDamage(participant._actor, roster.stats.side, telemetry);

  const krakenStats = calculateKrakenStats(teamTelemetry, enemyTelemetry);
  const turretsKraken = lodash.sum(krakenStats);

  const p      = participant.stats;
  const winner = (p.winner             ) ? 1 : 0;
  const afk    = (p.firstAfkTime !== -1) ? 1 : 0;

  
  const stats = {
    wins:              winner,
    afk:               afk,
    games:             1,
    kills:             p.kills,
    deaths:            p.deaths,
    assists:           p.assists,
    farm:              p.farm,
    turretCaptures:    p.turretCaptures,
    duration:          match.duration,
    gold:              p.gold,
    buildTime:         buildTime,
    buildGames:        (buildTime === 0) ? 0 : 1,
    fountainTime:      fountainTime,
    turretsKraken:     turretsKraken,
    krakenCaptures:    p.krakenCaptures,
    fountainGames:     (fountainTime === 0) ? 0 : 1,
    doubleKills:       doubleKills, 
    tripleKills:       tripleKills,
    damageDone:        damage.done,
    damageReceived:    damage.received,
    jungleCamps:       calculateJungleCamps(participant._actor, roster.stats.side, telemetry),
  }

  const res = {
    name:   checkName(participant.player.name),
    region: participant.player.shardId,
    ...stats,
    Heroes: {
      [participant.actor]: {
        hero: p.actor,
        ...stats
      }
    },
  }
  
  if (PROFILING) console.timeEnd(`${participant._actor} stats`);
  return res;

}

/**
 *    "wins": 46,
      "afk": 0,
      "games": 67,
      "kills": 276,
      "deaths": 172,
      "assists": 230,
      "farm": 2483.55,
      "turretCaptures": 46,
      "duration": 17484,
      "gold": 0,
      "buildTime": 9999,
      "reflexBlockAvg": 100,
      "fountainTime": 0,
      "doubleKills": 20,
      "tripleKills": 40,
      "Heroes": {
        "Baptiste": {
          "wins": 8,
          "krakencap": 0,
          "aces": 0,
          "games": 11,
          "afk": 0,
          "kills": 42,
          "deaths": 36,
          "assists": 40,
          "farm": 471.4,
          "turretCaptures": 8,
          "duration": 3096
        },
        "Reim": {
          "wins": 1,
          "krakencap": 0,
          "aces": 0,
          "games": 2,
          "afk": 0,
          "kills": 4,
          "deaths": 8,
          "assists": 7,
          "farm": 63.175,
          "turretCaptures": 2,
          "duration": 501
        },
        "Lance": {
          "wins": 8,
          "krakencap": 0,
          "aces": 0,
          "games": 9,
          "afk": 0,
          "kills": 40,
          "deaths": 16,
          "assists": 36,
          "farm": 356.325,
          "turretCaptures": 7,
          "duration": 2247
        }
      }
 */