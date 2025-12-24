# Changelog

## [1.8.5](https://github.com/ProseMirror/prosemirror-tables/compare/v1.8.4...v1.8.5) (2025-12-24)


### Bug Fixes

* improve cell selection with fallback strategy for merged cells ([#323](https://github.com/ProseMirror/prosemirror-tables/issues/323)) ([d141168](https://github.com/ProseMirror/prosemirror-tables/commit/d1411689ef3cf5871e80ce641e916755b4c29e08))

## [1.8.4](https://github.com/ProseMirror/prosemirror-tables/compare/v1.8.3...v1.8.4) (2025-12-22)


### Bug Fixes

* prevent cell selection on context menu open ([#324](https://github.com/ProseMirror/prosemirror-tables/issues/324)) ([92cd56b](https://github.com/ProseMirror/prosemirror-tables/commit/92cd56bdc5353a5e15625fa586140301a64546e8))

## [1.8.3](https://github.com/ProseMirror/prosemirror-tables/compare/v1.8.2...v1.8.3) (2025-12-03)


### Bug Fixes

* update repository URL in package.json ([#320](https://github.com/ProseMirror/prosemirror-tables/issues/320)) ([cdd85e6](https://github.com/ProseMirror/prosemirror-tables/commit/cdd85e6b23dbf1dc2c6de53ed986bf5163b486c0))

## [1.8.2](https://github.com/ProseMirror/prosemirror-tables/compare/v1.8.1...v1.8.2) (2025-12-03)


### Bug Fixes

* improve cell selection logic in merge cells ([#311](https://github.com/ProseMirror/prosemirror-tables/issues/311)) ([6ac5448](https://github.com/ProseMirror/prosemirror-tables/commit/6ac54486189a51ecefa3b43d1e29c6c4069552cf))

## [1.8.1](https://github.com/ProseMirror/prosemirror-tables/compare/v1.8.0...v1.8.1) (2025-08-27)


### Bug Fixes

* keep table cell type when moving a row ([#301](https://github.com/ProseMirror/prosemirror-tables/issues/301)) ([98cdf2d](https://github.com/ProseMirror/prosemirror-tables/commit/98cdf2d07e99acbd0e6aecfcc6f8acba2f0e7e65))

## [1.8.0](https://github.com/ProseMirror/prosemirror-tables/compare/v1.7.1...v1.8.0) (2025-08-27)


### Features

* add more commands and utils ([#296](https://github.com/ProseMirror/prosemirror-tables/issues/296)) ([bf4fc63](https://github.com/ProseMirror/prosemirror-tables/commit/bf4fc6332425f1d1689c29ecc4b70d722053dec8))

  New commands:

  - `moveTableRow`
  - `moveTableColumn`

  New utils:

  - `findTable`
  - `findCellRange`
  - `findCellPos`

## [1.7.1](https://github.com/ProseMirror/prosemirror-tables/compare/v1.7.0...v1.7.1) (2025-04-17)


### Bug Fixes

* fix validate for attribute colwidth ([#286](https://github.com/ProseMirror/prosemirror-tables/issues/286)) ([3346c6c](https://github.com/ProseMirror/prosemirror-tables/commit/3346c6c798f462a4f3d1c5ab47a2f74d62a07921))

## [1.7.0](https://github.com/ProseMirror/prosemirror-tables/compare/v1.6.4...v1.7.0) (2025-04-14)


### Features

* add validate support for schema ([#279](https://github.com/ProseMirror/prosemirror-tables/issues/279)) ([e74456a](https://github.com/ProseMirror/prosemirror-tables/commit/e74456a58caf381b375920f1cd752ef063acb98a))

## [1.6.4](https://github.com/ProseMirror/prosemirror-tables/compare/v1.6.3...v1.6.4) (2025-02-06)


### Bug Fixes

* remove zero sized tables via `fixTables` ([#267](https://github.com/ProseMirror/prosemirror-tables/issues/267)) ([fd6be97](https://github.com/ProseMirror/prosemirror-tables/commit/fd6be971b799b5c6d2c1a30a52032831e5fedddc))

## [1.6.3](https://github.com/ProseMirror/prosemirror-tables/compare/v1.6.2...v1.6.3) (2025-01-31)


### Bug Fixes

* disable resizing when the editor view is uneditable ([#261](https://github.com/ProseMirror/prosemirror-tables/issues/261)) ([8e7287c](https://github.com/ProseMirror/prosemirror-tables/commit/8e7287cfa47bab0da9a9e38cd9f65c7ece95d67d))

## [1.6.2](https://github.com/ProseMirror/prosemirror-tables/compare/v1.6.1...v1.6.2) (2024-12-24)


### Bug Fixes

* update prosemirror dependencies and fix type of ignoreMutation ([#259](https://github.com/ProseMirror/prosemirror-tables/issues/259)) ([465754b](https://github.com/ProseMirror/prosemirror-tables/commit/465754b97ecbca4778e0cc667511cd59f16db92a))

## [1.6.1](https://github.com/ProseMirror/prosemirror-tables/compare/v1.6.0...v1.6.1) (2024-10-30)


### Bug Fixes

* support defaultCellMinWidth in older Safari ([#255](https://github.com/ProseMirror/prosemirror-tables/issues/255)) ([1b36002](https://github.com/ProseMirror/prosemirror-tables/commit/1b36002196b6bdad11fce40b5a03e15a934f03e6))

## [1.6.0](https://github.com/ProseMirror/prosemirror-tables/compare/v1.5.1...v1.6.0) (2024-10-25)


### Features

* add new option `defaultCellMinWidth` for `columnResizing()` ([#253](https://github.com/ProseMirror/prosemirror-tables/issues/253)) ([662e857](https://github.com/ProseMirror/prosemirror-tables/commit/662e857d87fafcb5f77247205c2e91d392b7401d))

## [1.5.1](https://github.com/ProseMirror/prosemirror-tables/compare/v1.5.0...v1.5.1) (2024-10-23)


### Bug Fixes

* fix cell boundary selection cheap elimination ([#251](https://github.com/ProseMirror/prosemirror-tables/issues/251)) ([41e4139](https://github.com/ProseMirror/prosemirror-tables/commit/41e4139073f2e97bc86987adf80c7f3fa5a6dbda))

## [1.5.0](https://github.com/ProseMirror/prosemirror-tables/compare/v1.4.2...v1.5.0) (2024-08-22)


### Features

* export `cellNear` helper and `deleteCellSelection` command ([#239](https://github.com/ProseMirror/prosemirror-tables/issues/239)) ([fb7345b](https://github.com/ProseMirror/prosemirror-tables/commit/fb7345b2f39a8f022e3be32e4022d8697e683d6c))

## [1.4.2](https://github.com/ProseMirror/prosemirror-tables/compare/v1.4.1...v1.4.2) (2024-08-22)


### Miscellaneous Chores

* trigger release ([0ea1951](https://github.com/ProseMirror/prosemirror-tables/commit/0ea1951a22fc0e70713a26ce87e2875cae6b5887))

## [1.4.1](https://github.com/ProseMirror/prosemirror-tables/compare/v1.4.0...v1.4.1) (2024-08-22)


### Continuous Integration

* add release workflow ([#241](https://github.com/ProseMirror/prosemirror-tables/issues/241)) ([469cb11](https://github.com/ProseMirror/prosemirror-tables/commit/469cb11d2e3aa9e1b5b3e2a540431da69f1d64a1))
