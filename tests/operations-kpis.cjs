const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/nextgen.html','utf8');
const legacy={kpis:[{id:'k0_0',team:'Operations & Analytics',name:'Reporting timeliness',description:'Reports delivered on schedule',unit:'count',target:4,direction:'higher',weight:1},{id:'other',team:'Recruitment',name:'Other',target:10,unit:'count',direction:'higher',weight:2}],actuals:{'2026-10':{k0_0:{actual:4},other:{actual:5}}},notes:{}};
const context=vm.createContext({console,localStorage:{getItem:()=>JSON.stringify(legacy)},Date});
let src=html.slice(html.indexOf('const FN='),html.indexOf('function heroArt'));
src+=html.slice(html.indexOf('function teamCard'),html.indexOf('function lastSix'));
src+=html.slice(html.indexOf('function openUpdate'),html.indexOf('function configFields'));
vm.runInContext(src,context);
function run(s){return vm.runInContext(s,context)}
run("month='2026-10';chosenTeam=FN[0]");
assert.equal(run('operationsKpis().length'),5);
assert.equal(run('operationsKpis().map(k=>k.description).join("|")'),['100% bi-weekly Team action trackers issued within 48 hours.','Monthly cross-functional performance dashboard submitted on time.','Progress the agreed monthly milestone for a technology initiative improving an operational or process opportunity.','≥90% Team actions followed up by due date.','≥90% Team attendance plus substantive contribution to business/culture improvement.'].join('|'));
assert.equal(run('operationsKpis().map(k=>k.name).join("|")'),'Action Tracker Discipline|Performance Dashboard|HR Technology Transformation|Follow-Through|Team Contribution');
assert.equal(run('statTeam(FN[0]).total'),5);assert.equal(run('statTeam(FN[0]).count'),0);assert.equal(run('allStat().total'),6);
assert.equal(run('statTeam("Recruitment").score'),50);
assert.equal(run('JSON.stringify(state)'),JSON.stringify(legacy));
for(const view of ['teamDetails()','updatesPage()','reportsPage()']){const output=run(view);for(const title of run('operationsKpis().map(k=>k.name)'))assert.ok(output.includes(title));assert.ok(!output.includes('data-edit="k0_0"'));}
run("state.actuals[month][OPS_IDS[0]]={actual:80};state.actuals[month][OPS_IDS[3]]={actual:90};state.actuals[month][OPS_IDS[1]]={actual:1,target:1}");
assert.equal(run('result(operationsKpis()[0])'),80);assert.equal(run('result(operationsKpis()[3])'),100);assert.equal(run('result(operationsKpis()[1])'),null);
run("state.kpis.push({...operationsKpis()[0],id:'compatible-existing',weight:2});state.actuals[month]['compatible-existing']={actual:70}");
assert.equal(run('operationsKpis()[0].id'),'compatible-existing');assert.equal(run('result(operationsKpis()[0])'),70);assert.equal(run('operationsKpis()[0].weight'),2);
run("var cloudMode=false,cloudRole=null;var modal;function showModal(title,body,save){modal={title,body}};function closeModal(){};openUpdate(OPS_IDS[1]);");
assert.equal(run('modal.title'),'Manual scoring setup required');
run("openUpdate(OPS_IDS[3])");assert.ok(run('modal.body').includes('≥90% Team actions followed up by due date.'));
assert.equal(run('state.actuals[month].k0_0.actual'),4);
console.log('PASS: five ordered definitions, compatible identities, no legacy score remapping, historical retention, totals, scoring, forms, reports, manual scoring flags, other role preservation.');
