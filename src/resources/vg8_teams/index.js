import moment from 'moment';

import teamsSplit1 from './teams_split1';
import teamsSplit2 from './teams_split2';
import teamsSummer from './teams_summer';
import teamsEslTest from './teams_esl_test';
import teamsAutumn1 from './teams_autumn_1';

const SEASONS = [
  {
    season: 'summer',
    split: 1,
    name: 'summer01',
    start: 1498176000, // June 24 17
    end: 1500329600, // Monday, July 17, 2017 10:13:20 PM
    regions: [
      'tournament-na',
      'tournament-eu',
    ],
    teams: teamsSplit1,
  },
  {
    season: 'summer',
    split: 2,
    name: 'summer02',
    start: 1501100000, // Wednesday, July 26, 2017 8:13:20 PM
    end: 1502751600, // Monday, August 14, 2017 11:00:00 PM
    regions: [
      'tournament-na',
      'tournament-eu',
    ],
    teams: teamsSplit2,
  },
  {
    season: 'summer',
    split: 99,
    name: 'summer99',
    dontCount: true,
    start: 1504801609, // Thursday, 07-Sep-17 16:27:26 UTC
    end: 1504825200, // Thursday, 07-Sep-17 00:00:00 UTC in RFC 2822
    regions: [
      'tournament-na',
    ],
    teams: teamsEslTest,
  },
  {
    season: 'summer',
    split: 3,
    name: 'summer03',
    start: 1504886400, // Friday, September 8, 2017 4:00:00 PM
    end: 1505200000, // Tuesday, September 12, 2017 12:06:40 AM GMT-07:00 DST
    regions: [
      'tournament-na',
    ],
    teams: teamsSummer,
  },
  {
    season: 'autumn',
    split: 1,
    name: 'autumn01',
    start: 1506121200, //  Friday, September 22, 2017 4:00:00 PM GMT-07:00
    end: 1508194800, // Monday, October 16, 2017 4:00:00 PM GMT-07:00
    regions: [
      'tournament-na',
      'tournament-eu',
    ],
    teams: teamsAutumn1,
  },
];

const GETSEASON = (time) => {
  time = moment(time).format('X');

  const season = lodash.filter(SEASONS, (s) => {
    if (time > s.start && time < s.end) return s;
  });

  return (season[0]) ? season[0] : false;
};

const CURRENTSEASON = (GETSEASON());
