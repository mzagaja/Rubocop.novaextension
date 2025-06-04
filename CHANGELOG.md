## Version 1.5
* Add mise exec option for mise users.
* LLMs made JSON parsing unnecessarily complex so I refactored back to my original approach and then
  updated to resolve the real issue which was `end_line` is now `last_line`

## Version 1.4
* Add asdf exec option for asdf users.
* Fix rubocop JSON output parsing. Unclear when it changed, but this should work going forward.

## Version 1.3.1
* Fix README and configuration description to more accurately reflect final state of changes.

## Version 1.3
* Enable using `rvm do` with rubocop.

## Version 1.2
* Enable using `bundle exec` with rubocop.
* Bug: fix error if there are no fixes from Rubocop.

## Version 1.1

Add issue severity differentiation.

## Version 1.0

Initial release
