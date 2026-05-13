# ⚡ Quick Reference - Push to GitHub

## 🎯 Target Repository
`https://github.com/Brankli/Bingogame.git`

## 🚀 Quick Push (5 Commands)

```bash
# 1. Change remote
git remote set-url origin https://github.com/Brankli/Bingogame.git

# 2. Stage all changes
git add .

# 3. Commit
git commit -m "feat: Complete bingo game implementation"

# 4. Push
git push -u origin main

# 5. Verify
git remote -v
```

## 🤖 Automated Script

```bash
# Run the automated script
./push-to-github.sh
```

The script will:
- ✅ Change remote URL
- ✅ Stage all changes
- ✅ Commit with detailed message
- ✅ Push to GitHub
- ✅ Verify success

## 🔧 If Push Fails

### Repository Not Empty?
```bash
git pull origin main --allow-unrelated-histories
git push origin main
```

### Force Push (Overwrites Remote)?
```bash
git push origin main --force
```
⚠️ **Warning:** This will overwrite everything on GitHub!

### Permission Denied?
```bash
# Use personal access token
git remote set-url origin https://YOUR_TOKEN@github.com/Brankli/Bingogame.git
```

## 📊 What Will Be Pushed?

- **~100+ files** (code, docs, audio)
- **Complete bingo game** with all features
- **Full documentation** (40+ MD files)

## ✅ After Pushing

Visit: `https://github.com/Brankli/Bingogame`

---

**Need detailed instructions?** See `GITHUB_PUSH_GUIDE.md`
