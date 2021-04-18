
exports.activate = function() {
    
}

exports.deactivate = function() {
    // Clean up state before the extension is deactivated
}

class IssuesProvider {
    async provideIssues(editor) {
        return new Promise(function(resolve) {
            try {
                const options = {
                    args: ["rubocop", '--disable-pending-cops', '-fj', editor.document.path]
                };
                let rubocop = new Process("/usr/bin/env", options);
                let rawIssues = []
                let issues = [];
                const issueSeverity = {
                    'fatal': IssueSeverity.Error,
                    'error': IssueSeverity.Error,
                    'warning': IssueSeverity.Warning,
                    'refactor': IssueSeverity.Hint,
                    'convention': IssueSeverity.Hint,
                    'info': IssueSeverity.Info
                }
        
                rubocop.onStdout((line) => { rawIssues.push(line); });
                rubocop.onStderr((line) => { console.warn(`Rubocop ERROR: ${line}`); });
                rubocop.onDidExit((message) => {
                    const allIssues = JSON.parse(rawIssues)['files'][0]['offenses'];
                    allIssues.forEach((offense) => {
                        let issue = new Issue();
                        issue.message = offense['message']
                        issue.code = offense['cop_name']
                        issue.severity = issueSeverity[offense['severity']];
                        issue.column = offense["location"]["start_column"]
                        issue.endColumn = offense["location"]["end_column"]
                        issue.line = offense["location"]["start_line"]
                        issue.endLine = offense["location"]["end_line"]
                        issues.push(issue);
                    })
                    resolve(issues);
                    return;
                });
                rubocop.start();
            } catch(error) {
                console.error(`Rubocop error: ${error}`);
                resolve([]);
                return;
            }
        })
    }
}

nova.assistants.registerIssueAssistant("ruby", new IssuesProvider(), {event: "onChange"});