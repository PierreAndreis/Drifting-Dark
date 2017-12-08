class ProStats {

  create(match, proInfo) {

    const playerName = proInfo.name;
    const playerStats = match.players.find(p => p.name === playerName);
    
    if (!playerStats) return false;

    return {
      createdAt: match.createdAt,
      matchId:   match.id,
      proInfo,
      actor:    playerStats.actor,
      tier:     playerStats.tier,
      skilName: playerStats.skilName,
      winner:   playerStats.winner,
      kills:    playerStats.kills,
      deaths:   playerStats.deaths,
      assists:  playerStats.assists,
      items:    playerStats.items,
    };
    
  }

}

export default new ProStats();