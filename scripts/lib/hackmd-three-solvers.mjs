import { makeRng } from "./competition-tests-common.mjs";

export function solveCampfire(input) {
  const tokens=input.trim().split(/\s+/).map(Number), n=tokens[0], teams=tokens.slice(2);
  const before=new Int32Array(n), after=new Int32Array(n), flags=new Uint8Array(n), tree=new Int32Array(n+1);
  let boundaries=0;
  for(let i=0;i<n;i++) {
    before[i]=(i+n-1)%n; after[i]=(i+1)%n;
    flags[i]=Number(teams[i]!==teams[before[i]]); boundaries+=flags[i]; tree[i+1]=flags[i];
  }
  for(let i=1;i<=n;i++) { const parent=i+(i&-i); if(parent<=n) tree[parent]+=tree[i]; }
  function update(i,value) {
    const delta=value-flags[i]; flags[i]=value; boundaries+=delta;
    for(let at=i+1;at<=n;at+=at&-at) tree[at]+=delta;
  }
  function prefix(i) { let total=0; for(let at=i+1;at>0;at-=at&-at) total+=tree[at]; return total; }
  function kth(k) {
    let at=0,step=1; while(step*2<=n) step*=2;
    for(;step;step>>=1) if(at+step<=n && tree[at+step]<k) { k-=tree[at+step]; at+=step; }
    return at;
  }
  let current=0,eliminated=0;
  while(boundaries) {
    const preceding=prefix(current), victim=kth(preceding<boundaries ? preceding+1 : 1);
    const left=before[victim],right=after[victim];
    update(victim,0); after[left]=right; before[right]=left;
    update(right,Number(teams[left]!==teams[right]));
    current=after[current]; eliminated++;
  }
  return `${eliminated} ${teams[current]}`;
}

const prefer=(a,b)=>a===undefined || b.length<a.length || b.length===a.length && b<a ? b : a;
export function solveSuperstring(input) {
  const tokens=input.trim().split(/\s+/), words=tokens.slice(2);
  const s=words.filter((w,i)=>!words.some((other,j)=>i!==j && other.includes(w))), n=s.length;
  const overlaps=Array.from({length:n},()=>Array(n).fill(0));
  for(let i=0;i<n;i++) for(let j=0;j<n;j++) if(i!==j)
    for(let len=1;len<=Math.min(s[i].length,s[j].length);len++)
      if(s[i].slice(-len)===s[j].slice(0,len)) overlaps[i][j]=len;
  const dp=Array.from({length:1<<n},()=>Array(n));
  for(let i=0;i<n;i++) dp[1<<i][i]=s[i];
  for(let mask=1;mask<1<<n;mask++) for(let last=0;last<n;last++) if(dp[mask][last]!==undefined)
    for(let j=0;j<n;j++) if(!(mask>>j&1)) {
      const value=dp[mask][last]+s[j].slice(overlaps[last][j]);
      dp[mask|1<<j][j]=prefer(dp[mask|1<<j][j],value);
    }
  return dp.at(-1).reduce((best,value)=>value===undefined ? best : prefer(best,value),undefined);
}

export function reachableCollatz(n,k) {
  const seen=new Set([n]), queue=[[n,0]];
  for(let at=0;at<queue.length;at++) {
    const [value,depth]=queue[at]; if(depth===k) continue;
    const previous=[value*2], odd=(value-1)/3;
    if(Number.isInteger(odd) && odd>0 && odd%2===1) previous.push(odd);
    for(const v of previous) if(!seen.has(v)) { seen.add(v); queue.push([v,depth+1]); }
  }
  return [...seen].sort((a,b)=>a-b);
}
export function solveCollatz(input) {
  const tokens=input.trim().split(/\s+/).map(Number), [n,k]=tokens, good=reachableCollatz(n,k);
  let sum=0n;
  for(const query of tokens.slice(3)) {
    let lo=0,hi=good.length;
    while(lo<hi) { const mid=Math.floor((lo+hi)/2); if(good[mid]<query) lo=mid+1; else hi=mid; }
    const a=lo<good.length ? Math.abs(good[lo]-query) : Infinity;
    const b=lo>0 ? Math.abs(good[lo-1]-query) : Infinity;
    sum+=BigInt(Math.min(a,b));
  }
  return String(sum);
}
export const solvers={campfire:solveCampfire,superstring:solveSuperstring,collatz:solveCollatz};

export function hiddenInputs(key) {
  const rng=makeRng(20261101), cases=[];
  if(key==="campfire") {
    for(const a of [[1],[1,2],[1,2,3],[1,1,2,2],[2,1,1,2],[3,3,3,3]]) cases.push(`${a.length} 3\n${a.join(" ")}`);
    for(let t=0;t<35;t++) { const n=rng.int(2,80),k=rng.int(2,8); cases.push(`${n} ${k}\n${Array.from({length:n},()=>rng.int(1,k)).join(" ")}`); }
    for(const mode of [0,1,2]) cases.push(`200000 128\n${Array.from({length:200000},(_,i)=>mode===0 ? 128 : mode===1 ? i%2+1 : Math.floor(i/50000)+1).join(" ")}`);
  } else if(key==="superstring") {
    const groups=[["a"],["a","aa","aaa"],["ab","ba"],["ab","bc","ca"],["abc","bca","cab"],["az","za"],["abc","b","bc"],Array.from({length:8},(_,i)=>String.fromCharCode(97+i).repeat(10))];
    for(const words of groups) cases.push(`${words.length} 26\n${words.join("\n")}`);
    for(let t=0;t<25;t++) {
      const k=rng.int(2,5), n=rng.int(1,7), words=new Set();
      for(let tries=0;words.size<n;tries++) {
        if(tries>10000) throw new Error("Unable to generate distinct short words");
        words.add(Array.from({length:rng.int(1,6)},()=>String.fromCharCode(97+((rng.int(0,0xffffffff)>>>16)%k))).join(""));
      }
      cases.push(`${n} ${k}\n${[...words].join("\n")}`);
    }
  } else if(key==="collatz") {
    cases.push("1 0 4\n1 2 10 1000000000000","1 20 5\n1 2 4 8 16","7 1 3\n2 7 14","11 2 4\n7 14 22 44");
    for(let t=0;t<35;t++) { const q=rng.int(1,80); cases.push(`${rng.int(1,1000000)} ${rng.int(0,20)} ${q}\n${Array.from({length:q},()=>rng.int(0,999999)*1000000+rng.int(1,1000000)).join(" ")}`); }
    cases.push(`1 0 200000\n${Array(200000).fill("1000000000000").join(" ")}`);
    cases.push(`1000000 20 200000\n${Array.from({length:200000},(_,i)=>i%2 ? "1" : "1000000000000").join(" ")}`);
  } else throw new Error(`Unknown problem ${key}`);
  return [...new Set(cases)];
}
