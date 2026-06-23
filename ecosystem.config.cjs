module.exports = {
  apps: [
    {
      name: 'mm2d3d',
      cwd: './server',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '256M',
      env_production: {
        NODE_ENV: 'production',
        SERVE_STATIC: 'true',
        STATIC_DIR: '../dist',
        PORT: 3001,
        HOST: '0.0.0.0',
        DB_PATH: './data/lottery.db',
      },
    },
  ],
}
