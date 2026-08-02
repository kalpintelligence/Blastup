module.exports = {
  apps: [
    {
      name: 'wa-server',
      script: './server/dist/index.js',
      instances: 1,               // Single instance (WhatsApp socket is singleton)
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '300M', // Restart if RAM > 300MB
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/wa-server-error.log',
      out_file: './logs/wa-server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 5000,        // Wait 5s before restart
      max_restarts: 10,
      min_uptime: '5s',
      kill_timeout: 10000,        // 10s graceful shutdown
    },
    {
      name: 'wa-client',
      script: './client/.next/standalone/server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '200M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      error_file: './logs/wa-client-error.log',
      out_file: './logs/wa-client-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
