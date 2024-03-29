class ProStats {

  create(match, proInfo) {

    const playerName = proInfo.name;
    const playerStats = match.players.find(p => p.me);
    
    if (!playerStats) return false;

    return {
      createdAt: match.createdAt,
      matchId:   match.id,
      region:    match.shardId,
      proInfo,
      actor:    playerStats.hero,
      tier:     playerStats.tier,
      skillName: playerStats.skillName,
      winner:   playerStats.winner,
      kills:    playerStats.kills,
      role:     playerStats.role,
      deaths:   playerStats.deaths,
      assists:  playerStats.assists,
      items:    playerStats.items,
    };
    
  }

}

export default new ProStats();