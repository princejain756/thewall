module.exports = {
  apps: [
    {
      name: 'thewall',
      script: './dist/server/entry.mjs',
      cwd: '/root/websites/thewall',
      instances: 1,
      exec_mode: 'fork',
      node_args: '--import dotenv/config',
      env_file: '/root/websites/thewall/.env',
      env_production: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 5184,
      },
      max_memory_restart: '512M',
      error_file: '/var/log/pm2/thewall-error.log',
      out_file: '/var/log/pm2/thewall-out.log',
      merge_logs: true,
      time: true,
      autorestart: true,
      watch: false,
    },
  ],
};
