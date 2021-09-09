git branch -D gh-pages
git checkout -b gh-pages
rm -rf dist build
npm run build
git add -A
git commit -nm "deploy"
git push -f
git checkout master
