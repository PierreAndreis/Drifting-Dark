import Github from "@octokit/rest";

export default async (type, section) => {
  // check if there was an update made on the repo in the last hour
  // if no changes skip
  // get the files from the repo
  const files = await Github.repos.getContent({ owner: "Skillz4Killz", repo: "vgwiki", path: `${type}/${section}` });
  // run a loop to check which files were updated
  // update the redis with the changes
};
