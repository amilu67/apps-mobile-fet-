import { normalizeDayName } from "./utils.js";
function getText(n, sel){ const el=n.querySelector(sel); return (el?.textContent||"").trim(); }
function allNodes(doc, selectors){ for(const sel of selectors){ const list=[...doc.querySelectorAll(sel)]; if(list.length) return list; } return []; }
function toMinutes(hhmm){ const m=/^(\d{1,2}):(\d{2})/.exec(hhmm||""); if(!m) return null; return Number(m[1])*60+Number(m[2]); }

export function parseSolutionXml(xmlText, fallbackDayKeys){
  const doc=new DOMParser().parseFromString(xmlText,"application/xml");
  if(doc.querySelector("parsererror")) throw new Error("XML soluzione non valido.");

  const activityNodes=allNodes(doc,["Activities_Timetable > Activity","Time_Table > Activities_Timetable > Activity","timetable > activities_timetable > activity"]);
  const nodes=activityNodes.length?activityNodes:[...doc.querySelectorAll("*")].filter(n=>n.querySelector("Id")&&n.querySelector("Day")&&n.querySelector("Hour"));
  if(!nodes.length) throw new Error("Non trovo nodi attività (Id/Day/Hour) nell’XML soluzione.");

  const hoursRaw = nodes.map(n => getText(n,"Hour")).filter(Boolean);
  const timeHours = [...new Set(hoursRaw.filter(h => toMinutes(h) !== null))].sort((a,b)=>toMinutes(a)-toMinutes(b));
  const hourMap = new Map(timeHours.map((h, idx) => [h, idx+1]));

  return nodes.map(n=>nodeToPlacement(n,fallbackDayKeys,hourMap)).filter(Boolean);
}

function nodeToPlacement(n, fallbackDayKeys, hourMap){
  const id=Number(getText(n,"Id"));
  const dayRaw=getText(n,"Day");
  const hourRaw=getText(n,"Hour");
  const room=getText(n,"Room")||null;
  if(!id||!hourRaw) return null;

  let dayKey=null;
  if(/^\d+$/.test(dayRaw)){
    const idx=Number(dayRaw);
    dayKey=fallbackDayKeys?.[idx]||fallbackDayKeys?.[idx-1]||null;
  } else if(dayRaw){ dayKey=normalizeDayName(dayRaw); }
  if(!dayKey) dayKey="mon";

  let periodIndex1=1;
  if(/^\d+$/.test(hourRaw)) periodIndex1=Number(hourRaw)+1;
  else if(hourMap?.has(hourRaw)) periodIndex1=hourMap.get(hourRaw);
  return { activityId:id, dayKey, periodIndex1, room };
}
