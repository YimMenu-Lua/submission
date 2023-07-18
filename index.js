import core from "@actions/core";
import { context } from "@actions/github";
import { addFileToRepo, addLabelToIssue, closeIssueWithComment, createRepoAndInviteTo, getIssue, makeIssueComment } from "./GithubWrapper.js";
import { getIssueLabels, getRepoDescription, getRepoName } from "./Util.js";

/**
 * 
 * @param {string} token 
 * @param {string} reason 
 * @param {string} label 
 */
const markFailure = async (token, reason, label = 'internal-failure') => {
    core.error(reason);
    await closeIssueWithComment(token, `Failure handling issue`);
    await addLabelToIssue(token, label);

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

    const labels = getIssueLabels(issue);
    if (!labels.includes("submission"))
    {
        await markFailure(token, "Somehow someone managed to create an issue without label?");

        return;
    }

    const body = issue.body;
    const repoName = getRepoName(body).replace(' ', '-');
    const repoDescription = getRepoDescription(body);

    if (repoName.includes('\n') || repoName.includes('\r'))
    {
        await markFailure(token, "Repository name includes newlines, aborting...", 'invalid');

        return;
    }

    const result = await createRepoAndInviteTo(token, issue.user.login, repoName, repoDescription);
    if (!result)
    {
        await markFailure("Failed to create repo and invite collaborator.");

        return;
    }

    const metadata = {
        creator: issue.user.login,
        name: repoName,
        description: repoDescription
    };
    await addFileToRepo(token, repoName, 'metadata.json', 'Create metadata.json', JSON.stringify(metadata));
    await closeIssueWithComment(token, `Success, your repository has been created!\n\nYou can accept the invite by checking your email or clicking [here](https://github.com/${context.repo.owner}/${repoName}/invitations).`);
};

main();