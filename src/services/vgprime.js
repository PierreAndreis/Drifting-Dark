import fetch from "node-fetch";

// VERY BAD HARD CODED BELOW
export default (matches) => {
  return matches.forEach(match => fetch("http://services.vgpro.gg:3000/", {
    method: "POST",
    body: JSON.stringify(match),
    headers: { 'Content-Type': 'application/json' },
  })
  .catch(err => console.warn("FAILED TO SEND MATCH TO VGPRIME=", err)))
}