# e2e-im
Secure. End to end encrypted. Instant messaging.

# Deploy env
Ensure docker-compose installed:
1. `# apt update && apt upgrade`
2. `# apt install docker-compose`

# Start (also starts on boot)
1. `# ./dev.sh`

# Access the app
1. Open https://e2e-im.wtako.net

# Access the app in local
1. Change `nuxt/plugins/utils.js`, uncomment line 6
2. `# docker-compose build`
3. `# ./dev.sh`
5. Open http://localhost:31381/
