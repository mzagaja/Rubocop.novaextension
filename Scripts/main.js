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
                    cwd: nova.workspace.path,
                    args: ["rubocop", '--disable-pending-cops', '-fj', editor.document.path]
                };
                if(nova.config.get("Rubocop.bundle-exec", "boolean")) {
                    options.args.unshift("bundle", "exec")
                }
                if (nova.config.get("Rubocop.rvm-exec", "boolean")) {
                  const rubyVersionFile = nova.fs.open(
                    `${nova.workspace.path}/.ruby-version`
                  );
                  const rubyVersion = rubyVersionFile.readline().replace(/(\r\n|\n|\r)/gm, "");
                  options.args.unshift("rvm", rubyVersion, "--summary", "do");
                }
                
                if (nova.config.get("Rubocop.asdf-exec", "boolean")) {
                  options.args.unshift("asdf", "exec");
                }
                
                if (nova.config.get("Rubocop.mise-exec", "boolean")) {
                  options.args.unshift("mise", "exec", "--");
                }
                
                let rubocop = new Process("/usr/bin/env", options);
                let rawIssues = [];
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
                rubocop.onStderr((line) => { console.error(`Rubocop ERROR: ${line}`); });
                rubocop.onDidExit((message) => {
                    if(rawIssues.length === 0) {
                        return;
                    } else {
                        const allIssues = JSON.parse(rawIssues)['files'][0]['offenses'];
                        allIssues.forEach((offense) => {
                            let issue = new Issue();
                            issue.message = offense['message']
                            issue.code = offense['cop_name']
                            issue.severity = issueSeverity[offense['severity']];
                            issue.column = offense["location"]["start_column"]
                            issue.endColumn = offense["location"]["last_column"]
                            issue.line = offense["location"]["start_line"]
                            issue.endLine = offense["location"]["last_line"]
                            issues.push(issue);
                        })
                        resolve(issues);
                    }
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