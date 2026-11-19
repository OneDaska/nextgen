const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('public/nextgen-app.js','utf8');const context=vm.createContext({console,localStorage:{getItem:()=>null},Date});vm.runInContext(source.slice(source.indexOf('const FN='),source.indexOf('function heroArt')),context);const run=s=>vm.runInContext(s,context);const approx=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
// Empty months count all expected work while retaining a separate reporting status.
assert.equal(run("statTeam('Learning & Development').score"),0);assert.equal(run('allStat().score'),0);assert.equal(run('allStat().total'),45);assert.equal(run('allStat().filled'),0);assert.equal(run("teamStatus(statTeam('Learning & Development'))"),'Not reported');
run("var victor=activeKpis().filter(k=>k.team==='Learning & Development');state.actuals[month]={[victor[0].id]:{actual:100}};");assert.equal(run("statTeam('Learning & Development').score"),20);assert.equal(run("statTeam('Learning & Development').count"),1);approx(run('allStat().score'),20/9);assert.equal(run('score(allStat().score)'),'2.2%');assert.equal(run('allStat().filled'),1);assert.equal(run('allStat().submitted'),0);assert.equal(run('kpiStatus(victor[1])'),'No update');assert.equal(run('kpiStatus(victor[3])'),'Scoring setup required');
// Unconfigured milestones remain in the denominator; no target is invented.
run('for(const k of victor){if(k.target!==null)state.actuals[month][k.id]={actual:k.target};}');assert.equal(run("statTeam('Learning & Development').score"),80);assert.equal(run("statTeam('Learning & Development').count"),4);
// Each KPI has the same contribution even if historical weights differ.
run('victor[3].unit="count";victor[3].target=1;state.actuals[month][victor[3].id]={actual:1};victor[0].weight=99;');assert.equal(run("statTeam('Learning & Development').score"),100);approx(run('allStat().score'),100/9);assert.equal(run('allStat().submitted'),1);
run('state.actuals[month][victor[0].id].actual=0;');assert.equal(run("statTeam('Learning & Development').score"),80);assert.equal(run("statTeam('Learning & Development').count"),5);assert.equal(run('kpiStatus(victor[0])'),'Not achieved');
run('state.actuals[month][victor[0].id].actual=null;');assert.equal(run("statTeam('Learning & Development').score"),80);assert.equal(run("statTeam('Learning & Development').count"),4);assert.equal(run('kpiStatus(victor[0])'),'No update');assert.equal(run("statTeam('Learning & Development','2020-01').score"),0);
// Archived rows never add achievement; all 45 full results produce exactly 100%.
run('state.kpis.push({id:"old-archived",team:"Learning & Development",archived:true,unit:"count",target:1});state.actuals[month]["old-archived"]={actual:100};for(const k of activeKpis()){if(k.target===null){k.unit="count";k.target=1;}state.actuals[month][k.id]={actual:k.target};}');assert.equal(run('allStat().score'),100);assert.equal(run('allStat().filled'),45);assert.equal(run('allStat().submitted'),9);assert.equal(run('statusText(null)'),'Not reported');assert.equal(run('score(100)'),'100%');
console.log('PASS: fixed five-KPI and nine-function denominators; 1/5 = 20%, team = 2.2%; blanks, real zero, unconfigured targets, equal weights, month isolation, archived rows, and full completion.');

// Finance regression: two missed targets earn no partial credit, but all saved actuals count.
run("var finance=activeKpis().filter(k=>k.team==='Finance');[95.1,88.3,95,1,95].forEach((v,i)=>state.actuals[month][finance[i].id]={actual:v});finance[2].unit='percent';finance[2].target=90;");
assert.equal(run("statTeam('Finance').score"),60);assert.equal(run("statTeam('Finance').achieved"),3);assert.equal(run("statTeam('Finance').count"),5);assert.equal(run('kpiStatus(finance[0])'),'Not achieved');assert.equal(run('result(finance[1])'),0);
// Comparison uses raw values, monthly target overrides, and the correct direction.
run("state.actuals[month][finance[0].id]={actual:97.999};");assert.equal(run('result(finance[0])'),0);
run("state.actuals[month][finance[0].id]={actual:98};");assert.equal(run('result(finance[0])'),100);
run("state.actuals[month][finance[0].id]={actual:98,target:99};");assert.equal(run('result(finance[0])'),0);
run("finance[0].direction='lower';state.actuals[month][finance[0].id]={actual:98,target:98};");assert.equal(run('result(finance[0])'),100);
run("state.actuals[month][finance[0].id].actual=98.1;");assert.equal(run('result(finance[0])'),0);
run("state.actuals[month][finance[0].id].actual=0;");assert.equal(run('result(finance[0])'),100);assert.equal(run("statTeam('Finance').count"),5);
run("finance[0].unit='unconfigured';");assert.equal(run('result(finance[0])'),null);assert.equal(run("statTeam('Finance').count"),5);
for(const value of [null,undefined,'',' ', 'invalid',Infinity]){context.invalidActual=value;run('state.actuals[month][finance[0].id].actual=invalidActual');assert.equal(run("statTeam('Finance').count"),4);}
console.log('PASS: binary target achievement, Finance 3/5 = 60% with 5/5 updated, exact boundaries, monthly overrides, lower targets, real zero and unconfigured reporting.');
