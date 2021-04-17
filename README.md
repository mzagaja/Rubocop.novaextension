
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

Following the [Rails Doctrine](https://rubyonrails.org/doctrine/#convention-over-configuration)
this extension does not require nor support configuration. It will use your global
Rubocop installation. 
