# Trading Bot

This project is a trading bot application built with Next.js, TypeScript, Node.js, Express, and `dotenv`. It integrates with various APIs to enable trading and provides a user interface for managing trades and viewing historical data.

## Folder Structure

```
/bark-trading-bot-app
│
├── /src
│   ├── /api
│   │   ├── /trading
│   │   │   ├── tradingController.ts      # Trading logic and endpoint handlers
│   │   │   ├── tradingService.ts         # Business logic for trading
│   │   │   └── tradingRoutes.ts          # API routes for trading
│   │   │
│   │   ├── /history
│   │   │   ├── historyController.ts      # Historical data logic and endpoint handlers
│   │   │   ├── historyService.ts         # Business logic for historical data
│   │   │   └── historyRoutes.ts          # API routes for historical data
│   │   │
│   │   ├── /auth
│   │   │   ├── authMiddleware.ts         # Authentication middleware
│   │   │   ├── authService.ts            # Authentication logic
│   │   │   └── authRoutes.ts             # API routes for authentication
│   │   │
│   │   └── server.ts                     # Express server setup
│   │
│   ├── /components                      # React components for frontend
│   ├── /pages                           # Next.js pages
│   │   ├── /api                         # API routes for Next.js
│   │   │   ├── trading.ts               # API route for trading
│   │   │   └── history.ts               # API route for historical data
│   │   └── _app.ts                      # Custom App component
│   │   └── index.ts                    # Home page
│   │
│   ├── /public                          # Static files (e.g., images, fonts)
│   ├── /styles                          # CSS/SCSS stylesheets
│   ├── /types                           # TypeScript types and interfaces
│   ├── /utils                           # Utility functions and helpers
│   └── /config                          # Configuration files (e.g., environment variables)
│
├── .env                                 # Environment variables
├── next.config.js                       # Next.js configuration
├── tsconfig.json                        # TypeScript configuration
├── package.json                         # Project dependencies and scripts
├── README.md                            # Project documentation
└── .gitignore                           # Git ignore file
```

## Getting Started

### Prerequisites

- Node.js (>= 16.x)
- npm (or yarn)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/barkprotocol/bark-trading-bot-app.git
   cd trading-bot-app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:

   ```env
   PORT=3000
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   SOLANA_KEYPAIR=/path/to/your/keypair.json
   ACCESS_TOKEN_SECRET=your_jwt_secret
   CMC_API_KEY=your_coinmarketcap_api_key
   ```

4. Start the server:

   ```bash
   npm run server
   ```

5. In a separate terminal, start the Next.js development server:

   ```bash
   npm run dev
   ```

### Running Tests

- To run tests, use the following command:

  ```bash
  npm test
  ```

## Deployment

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Contributing

If you'd like to contribute to this project, please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Create a new Pull Request.

## License

The MIT License. See the [LICENSE](LICENSE) file for details.
