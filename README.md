
**Rubocop** automatically lints all open files, then reports errors and warnings in Nova's **Issues** sidebar and the editor gutter:

<!--
🎈 It can also be helpful to include a screenshot or GIF showing your extension in action:
-->

![](https://www.zagaja.com/images/rubocop-extension-screenshot.png)

## Requirements

Rubocop requires some additional tools to be installed on your Mac:

- [Node.js 8.2.0](https://nodejs.org) and NPM 5.2.0 or newer
- [Rubocop](https://rubocop.org)

Running the following command should globally install Rubocop for most use cases:
```sh
gem install rubocop rubocop-rails rubocop-rspec rubocop-md
```


### Configuration
* We now let you choose whether to prepend your rubocop with `bundle exec`. If you do not it will
use `rubocop` from your default/global gemset.

### Troubleshooting
If you have a .rubocop.yml with `inherit_gem` and use `rvm` you will need to make sure your gems are
all available in the default gemset. The easiest way to do this is to avoid using app specific
gemsets. Otherwise try:

```sh
cd $APP_DIRECTORY
rvm gemset use default
bundle install
```
