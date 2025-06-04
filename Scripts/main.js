exports.activate = function() {
    // Register save listener for auto-correction
    nova.workspace.onDidAddTextEditor((editor) => {
        editor.onDidSave((editor) => {
            // Only auto-correct Ruby files
            if (editor.document.syntax === "ruby") {
                autoCorrectFile(editor);
            }
        });
    });
}

exports.deactivate = function() {
    // Clean up state before the extension is deactivated
}

function autoCorrectFile(editor) {
    // Check if auto-correction is enabled in preferences
    if (!nova.config.get("Rubocop.auto-correct", "boolean")) {
        return;
    }
    
    return new Promise(function(resolve, reject) {
        try {
            const options = {
                cwd: nova.workspace.path,
                args: ["rubocop", '--disable-pending-cops', '--auto-correct', editor.document.path]
            };
            
            // Apply the same execution environment options as the issues provider
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
            let output = [];
            
            rubocop.onStdout((line) => { 
                output.push(line); 
            });
            
            rubocop.onStderr((line) => { 
                console.error(`Rubocop auto-correct ERROR: ${line}`); 
            });
            
            rubocop.onDidExit((status) => {
                if (status === 0 || status === 1) {
                    // Status 0 = no issues, Status 1 = issues found/corrected
                    resolve();
                } else {
                    console.error(`Rubocop auto-correct failed with status: ${status}`);
                    reject(new Error(`Rubocop failed with status ${status}`));
                }
            });
            
            rubocop.start();
        } catch(error) {
            console.error(`Rubocop auto-correct error: ${error}`);
            reject(error);
        }
    });
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