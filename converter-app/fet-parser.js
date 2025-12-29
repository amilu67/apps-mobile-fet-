import { uniq, normalizeDayName } from "./utils.js";
function textOf(node, selector){ const el=node.querySelector(selector); return (el?.textContent||"").trim(); }
function allText(root, selector){ return [...root.querySelectorAll(selector)].map(x=>(x.textContent||"").trim()).filter(Boolean); }

export function parseFetXml(xmlText){
  const doc=new DOMParser().parseFromString(xmlText,"application/xml");
  if(doc.querySelector("parsererror")) throw new Error("XML non valido (.fet).");
  const fet=doc.documentElement;
  const schoolName=textOf(fet,"Institution_Name")||"Orario Scolastico";

  const dayNames=allText(fet,"Days_List > Day > Name");
  const days=dayNames.length?dayNames:["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì"];
  const dayKeys=days.map(d=>normalizeDayName(d));

  const hourNames=allText(fet,"Hours_List > Hour > Name");
  const periods=hourNames.length?hourNames.map((_,i)=>String(i+1)):["1","2","3","4","5","6","7"];

  const teachers=allText(fet,"Teachers_List > Teacher > Name");
  const subjects=allText(fet,"Subjects_List > Subject > Name");
  const rooms=allText(fet,"Rooms_List > Room > Name");

  const years=[...fet.querySelectorAll("Students_List > Year")];
  const classes=[];
  for(const y of years){
    const yName=textOf(y,"Name");
    const groups=[...y.querySelectorAll(":scope > Group")];
    if(!groups.length && yName) classes.push(yName);
    for(const g of groups){
      const gName=textOf(g,"Name");
      const cls=(yName && gName)?`${yName}${gName}`:(gName||yName);
      if(cls) classes.push(cls);
    }
  }

  const activities=[...fet.querySelectorAll("Activities_List > Activity")].map(a=>{
    const id=textOf(a,"Id");
    const teachers1=allText(a,"Teachers > Teacher");
    const teacherSingle=textOf(a,"Teacher");
    const t=teachers1.length?teachers1:(teacherSingle?[teacherSingle]:[]);
    const subj=textOf(a,"Subject");
    const students1=allText(a,"Students > Student");
    const studentsSingle=textOf(a,"Students");
    const st=students1.length?students1:(studentsSingle?[studentsSingle]:[]);
    const duration=Number(textOf(a,"Duration")||"1");
    return { id: id?Number(id):null, subject:subj, teachers:t, students:st, duration };
  });

  return { schoolName, days, dayKeys, periods, teachers:uniq(teachers), subjects:uniq(subjects), rooms:uniq(rooms), classes:uniq(classes), activities };
}
