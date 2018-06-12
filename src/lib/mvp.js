import lodash from "lodash";

export default (players, rosters, gameMode) => {
  if (gameMode.toLowerCase().includes("private")) {
    return players.map(p => ({ ...p, score: 0 }));
  }

  let inverseTeam = {
    "right/red": "left/blue",
    "left/blue": "right/red"
  };

  // let kdaRelative = {};
  let kdaRelative = [];

  let teams = {};

  players.forEach(p => {
    // Organize team by their side and role
    lodash.set(teams, `${p.side}.${p.role}.${p.id}`, p);

    // To calculate each side KDA
    // kdaRelative[p.side] = [...lodash.get(kdaRelative, `${p.side}`, []), (p.kills + p.assists) / (Math.pow(p.deaths, 0.75) || 1)];
    kdaRelative.push(
      (p.kills + p.assists) / (Math.pow(p.deaths, 0.75) || 1)
    );
  });

  lodash.forEach(teams, (side, sideIndex) => {
    lodash.forEach(side, (role, roleIndex) => {
      let totalMembers = Math.max(1, Object.keys(role).length);
      let cs = 0;
      let gold = 0;
      let helper = 0;

      lodash.forEach(role, (player, id) => {
        cs += player.farm;
        gold += player.gold;

        // if (roleIndex === "Captain") helper += player.gold / Math.pow(player.farm, 0.33)
        // 06/11/18 - Removing farm from captain
        if (roleIndex === "Captain") helper += player.gold / 1;
        else helper += player.farm * player.gold;
      });

      teams[sideIndex][roleIndex] = {
        cs: cs / totalMembers,
        gold: gold / totalMembers,
        helper: helper
      };
    });
  });

  let kdaRelativeAvg =
    kdaRelative.reduce((v, n) => v + n, 0) / (kdaRelative.length || 1);

  return players.map(p => {
    let kda = (p.kills + p.assists) / (Math.pow(p.deaths, 0.75) || 1);
    // let kdaScaled = kda/ kdaRelativeAvg[p.side];
    let kdaScaled = kda / kdaRelativeAvg;

    let avgsEnemy = teams[inverseTeam[p.side]][p.role] || 1;
    let avgsTeam = teams[p.side][p.role] || 1;

    let pointsScaled = 0;

    if (p.role === "Carry" && gameMode.includes("5v5")) {
      pointsScaled +=
        (p.farm / avgsTeam.cs) *
        (p.gold / avgsTeam.gold) *
        (avgsTeam.helper / avgsEnemy.helper);
    } else {
      pointsScaled += avgsTeam.helper / avgsEnemy.helper;
    }

    let score = pointsScaled * kdaScaled;

    score = score > 1 ? Math.pow(score, 0.5) : Math.pow(score, 2);

    return {
      ...p,
      score
    };
  });
};
