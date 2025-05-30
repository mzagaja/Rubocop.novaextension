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
                
                let rubocop = new Process("/usr/bin/env", options);
                let rawOutput = ""; // Changed from array to string
                let issues = [];
                const issueSeverity = {
                    'fatal': IssueSeverity.Error,
                    'error': IssueSeverity.Error,
                    'warning': IssueSeverity.Warning,
                    'refactor': IssueSeverity.Hint,
                    'convention': IssueSeverity.Hint,
                    'info': IssueSeverity.Info
                }
                
                // Accumulate all stdout data into a single string
                rubocop.onStdout((line) => { rawOutput += line; });
                rubocop.onStderr((line) => { console.error(`Rubocop ERROR: ${line}`); });
                rubocop.onDidExit((message) => {
                    if(rawOutput.trim().length === 0) {
                        resolve([]);
                        return;
                    }
                    
                    try {
                        const rubcopResult = JSON.parse(rawOutput);
                        
                        // Find the file that matches the current editor document
                        const currentFile = rubcopResult.files?.find(file => 
                            file.path === editor.document.path || 
                            file.path.endsWith(editor.document.path.split('/').pop())
                        );
                        
                        if (!currentFile || !currentFile.offenses) {
                            resolve([]);
                            return;
                        }
                        
                        currentFile.offenses.forEach((offense) => {
                            let issue = new Issue();
                            issue.message = offense.message;
                            issue.code = offense.cop_name;
                            issue.severity = issueSeverity[offense.severity] || IssueSeverity.Info;
                            issue.line = offense.location.start_line;
                            issue.endLine = offense.location.last_line; // Fixed: was end_line, should be last_line
                            issue.column = offense.location.start_column;
                            issue.endColumn = offense.location.last_column; // Fixed: was end_column, should be last_column
                            issues.push(issue);
                        });
                        
                        resolve(issues);
                    } catch(parseError) {
                        console.error(`Rubocop JSON parse error: ${parseError}`);
                        console.error(`Raw output: ${rawOutput}`);
                        resolve([]);
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