# Changelog

## [Unreleased]

### Added
- Added type definitions for `TradePair` and `Token` to improve type safety and documentation.
- Added detailed documentation for all methods and interfaces.

### Changed
- Updated method signatures to use `TradePair` and `Token` interfaces, enhancing readability and consistency.
- Improved error handling across methods to ensure robustness and clearer logging.

### Fixed
- Corrected handling of token balances and USD value calculations to manage errors gracefully and ensure accurate results.

## [1.1.0] - 2024-08-07

### Added
- **Type Checking**: Added type definitions for `TradePair` and `Token` to ensure correct parameter usage and improve code maintainability.
- **Documentation**: Updated function and class documentation to clearly describe parameters, return types, and usage.
  
### Changed
- **Error Handling**: Enhanced error handling in `fetchTokenBalance`, `determineTradeNecessity`, and other methods to ensure robustness and provide clearer error messages.
- **Validation**: Added validation to ensure that values are correctly handled, particularly for token amounts and trade decisions.

### Fixed
- **Balance Calculation**: Corrected the calculation and conversion of token balances and USD values to prevent potential issues with floating-point arithmetic and incorrect conversions.

## [1.0.0] - 2024-07-01

### Added
- Initial release of the `MarketMaker` class with basic market-making strategy implementation.
- Functions for trading between SOL and BARK, including fetching token balances and determining trade necessity.

### Changed
- Basic logging and error handling for trading operations.
- Configurable parameters for trading such as slippage, price tolerance, and rebalance percentage.
