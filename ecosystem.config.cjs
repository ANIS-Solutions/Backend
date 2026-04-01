module.exports = {
  apps: [
    {
      name: 'anis-backend',
      script: './dist/server.js', // Point to your BUILT file
      instances: '6', // Use all CPU cores
      exec_mode: 'cluster', // Enable clustering
      watch: false, // Don't watch files in production
      env: {
        // Default environment variables
        NODE_ENV: 'dev',
      },
      env_production: {
        // Variables for when you run with --env production
        NODE_ENV: 'production',
        PORT: 5000,
        // If you have a config.env file, you usually rely on dotenv in your code
        // BUT for critical vars like NODE_ENV, set them here.
      },
    },
  ],
};
