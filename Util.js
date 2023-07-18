/**
 * 
 * @param {string} body Body to extra the subsection from
 * @param {string} label Label of the subsection
 * @returns 
 */
const getBodyFromSubsection = (body, label) => {
    const match = body.match(`(?<=### ${label}\n\n)((.|\n)[^(?=\n\n###)?]+)`);

    return match.length ? match[0] : undefined;
}

/**
 * Returns all the labels on this issue in an array.
 * @param {Object} issue 
 * @returns {Array<string>}
 */
export const getIssueLabels = issue => {
    /**
     * @type {Array<Object>}
     */
    const labels = issue?.labels;
    if (!labels)
        return [];

    return labels.map(label => label.name);
};

/**
 * @param {string} body The issue body
 * @returns {string|undefined} The body of the 'Repository Name' subsection.
 */
export const getRepoDescription = body => {
    return getBodyFromSubsection(body, 'Repository Name');
};

/**
 * @param {string} body The issue body
 * @returns {string|undefined} The body of the 'Repository Name' subsection.
 */
export const getRepoName = body => {
    return getBodyFromSubsection(body, 'Description');
};

export default {
    getIssueLabels,
    getRepoDescription,
    getRepoName
};