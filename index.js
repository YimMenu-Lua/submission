import core from "@actions/core";
import { context } from "@actions/github";
import { addFileToRepo, addLabelToIssue, closeIssueWithComment, createRepoAndInviteTo, getIssue } from "./src/GithubWrapper.js";
import { getIssueLabels, getRepoDescription, getRepoName, isBlackListedRepo } from "./src/Util.js";

/**
 * 
 * @param {string} token 
 * @param {string} reason 
 * @param {string} label 
 */
const markFailure = async (token, reason, label = 'internal-failure') => {
    await closeIssueWithComment(token, `Failure handling issue`);
    await addLabelToIssue(token, label);

    core.error(reason);
    core.setFailed(`Submission Issue Handling Failure: "${reason}"`);
};

const main = async _ => {
    const token = core.getInput('github-token');
    
    const issue = await getIssue(token);
    if (!issue)
    {
        await markFailure(token, "No issue in current context?");

        return;
    }
    core.debug("Got a valid issue.");

    const labels = getIssueLabels(issue);
    if (!labels.includes("submission"))
    {
        await markFailure(token, "Somehow someone managed to create an issue without label?");

        return;
    }
    core.debug("Submission label is present.");

    const body = issue.body;
    const repoName = getRepoName(body).replace(' ', '-');
    const repoDescription = getRepoDescription(body);
    core.debug(`Parsed the following { repoName: "${repoName}", repoDescription: "${repoDescription}" }`);

    if (repoName.includes('\n') || repoName.includes('\r'))
    {
        await markFailure(token, "Repository name includes newlines, aborting...", 'invalid');

        return;
    }
    core.debug("Repo name doesn't contain any newlines.");

    if (isBlackListedRepo(repoName))
    {
        await markFailure(token, "Repository name is on the blacklist.");

        return;
    }
    core.debug("Repo name does not contain any blacklisted names.");

    const result = await createRepoAndInviteTo(token, issue.user.login, repoName, repoDescription);
    if (!result)
    {
        await markFailure("Failed to create repo and invite collaborator.");

        return;
    }
    core.debug("Created repo and invited user as collaborator.");

    const metadata = {
        creator: issue.user.login,
        name: repoName,
        description: repoDescription
    };
    await addFileToRepo(token, repoName, 'metadata.json', 'Create metadata.json', JSON.stringify(metadata, null, 4));
    await closeIssueWithComment(token, `Success, your repository has been created!\n\nYou can accept the invite by checking your email or clicking [here](https://github.com/${context.repo.owner}/${repoName}/invitations).`);
};

main();