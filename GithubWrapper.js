import github, { context } from "@actions/github";

const getIssueNumber = () => context.payload?.issue?.number;

/**
 * 
 * @param {string} token 
 * @param {string} repo 
 * @param {string} path
 * @param {string} commitMsg
 * @param {string} filecontents 
 * @returns {Promise<boolean>}
 */
export const addFileToRepo = async (token, repo, path, commitMsg, filecontents) => {
    const base64 = btoa(filecontents);

    const octokit = github.getOctokit(token);

    const {status} = await octokit.rest.repos.createOrUpdateFileContents({
        owner: context.repo.owner,
        repo,
        path,
        content: base64,
        message: commitMsg
    });

    return status == 201;
};

/**
 * 
 * @param {string} token Token
 * @param {string} label Label
 */
export const addLabelToIssue = async (token, label) => {
    const octokit = github.getOctokit(token);

    await octokit.rest.issues.addLabels({
        ...context.repo,
        issue_number: getIssueNumber(),
        labels: [label]
    });
};

export const closeIssue = async token => {
    const octokit = github.getOctokit(token);

    const {status} = await octokit.rest.issues.update({
        ...context.repo,
        issue_number: getIssueNumber(),
        state: 'closed'
    });

    return status == 200;
};

/**
 * 
 * @param {string} token 
 * @param {string} body 
 */
export const closeIssueWithComment = async (token, body) => {
    await makeIssueComment(token, body);
    await closeIssue(token);
};

/**
 * 
 * @param {string} token 
 * @param {string} owner 
 * @param {string} name 
 * @param {string} description 
 * @returns {Promise<boolean>}
 */
export const createRepoAndInviteTo = async (token, owner, name, description) => {
    const octokit = github.getOctokit(token);

    const { status } = await octokit.rest.repos.createInOrg({
        org: context.repo.owner,
        name,
        description,
        visibility: 'public',
        has_projects: false,
        auto_init: true,
    });
    
    if (status == 201)
    {
        const { status } = await octokit.rest.repos.addCollaborator({
            owner: context.repo.owner,
            repo: name,
            username: owner,
            permission: 'push'
        });

        return status == 201 || status == 204;
    }
    
    return false;
};

/**
 * Grabs the issue from the current context.
 * @param {string} token
 * @returns {Promise}
 */
export const getIssue = async token => {
    const octokit = github.getOctokit(token);

    const issueNumber = getIssueNumber();
    if (issueNumber)
    {
        const { data } = await octokit.rest.issues.get({
            ...context.repo,
            issue_number: issueNumber
        });

        return data;
    }
    
    return null;
};

/**
 * 
 * @param {string} token 
 * @param {string} body 
 * @returns {Promise<boolean>}
 */
export const makeIssueComment = async (token, body) => {
    const octokit = github.getOctokit(token);

    const {status} = await octokit.rest.issues.createComment({
        ...context.repo,
        issue_number: getIssueNumber(),
        body
    });

    return status == 201;
};

export default {
    addLabelToIssue,
    getIssue
};