import * as fs from 'fs';
import * as path from 'path';

// Define the available environments
const ENVIRONMENTS = ['default', 'production', 'development'] as const;
type Environment = typeof ENVIRONMENTS[number];

// Load the environment variable, default to 'default'
const env: Environment = (process.env.NODE_ENV as Environment) || 'default';

// Define the paths to the configuration files
const configDir = path.resolve(__dirname);
const defaultConfigPath = path.join(configDir, 'default.json');
const envConfigPath = path.join(configDir, `${env}.json`);

// Function to load the configuration
function loadConfig() {
    let config = {};

    // Load default configuration
    if (fs.existsSync(defaultConfigPath)) {
        config = { ...JSON.parse(fs.readFileSync(defaultConfigPath, 'utf-8')) };
    }

    // Load environment-specific configuration
    if (fs.existsSync(envConfigPath)) {
        const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf-8'));
        config = { ...config, ...envConfig };
    }

    return config;
}

// Load and export the configuration
const CONFIG = loadConfig();

export default CONFIG;
