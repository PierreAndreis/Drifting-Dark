const Benchmark = require('benchmark');
const merge     = require("../dist/lib/utils").merge;
const merge_two = require("../dist/lib/utils").merge_two;
const playerStats = require("./__mockup__/playerStats.json");

const suite = new Benchmark.Suite;

suite.add('Own Merge', function() {
  return merge(playerStats, playerStats);
})
.add('Lodash Merge', function() {
  return merge_two(playerStats, playerStats);
})

// add listeners
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
// run async
.run({ 'async': false });