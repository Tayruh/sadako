# Change Log


## 1.1

- Added support for `+ >>=` choice include tokens.
- Fixed issue where `<>` attach token wasn't highlighting before `::` inline condition tokens.
- Changed all instances of `\s` in regexp to `[\t\ ]`. This may not be necessary since TextMate format only supports single line matching, but it's better to be safe.

## [Unreleased]

- Initial release