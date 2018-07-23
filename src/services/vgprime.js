import fetch from "node-fetch";

// VERY BAD HARD CODED BELOW
// Dont care.
export default matches => {
  return matches.forEach(match =>
    fetch("https://services.vgpro.gg/input", {
      method: "POST",
      body: JSON.stringify(match),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic dG9rZW46amVhbi1saW5kbw=="
      }
    })
      .catch(err => console.warn("FAILED TO SEND MATCH TO VGPRIME=", err))
  );
};
