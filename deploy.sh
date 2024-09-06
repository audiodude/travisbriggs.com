set -e

npm run build
netlify deploy --prod -d _site
./deploy_gemini.sh