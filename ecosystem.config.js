module.exports = {
  apps: [{
    name: 'adinsight',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    env: { NODE_ENV: 'production', PORT: 3030 }
  }]
};
