REMOTE_URL=$(git remote get-url origin)

rm -rf dist build
npm run build

cd dist
git init
git remote add origin $REMOTE_URL
git checkout -b gh-pages

git add -A
git commit -nm "deploy"
git push -fu origin gh-pages

cd ..
rm -rf dist build
