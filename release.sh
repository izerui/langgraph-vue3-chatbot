#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${SCRIPT_DIR}"

cd "${REPO_ROOT}"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "错误: 未找到 pnpm，请先安装 pnpm。" >&2
  exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
PACKAGE_VERSION="$(node -p "require('./package.json').version")"

PRE_PUBLISH_COMMIT_MESSAGE="${1:-release: prepare v${PACKAGE_VERSION}}"
POST_PUBLISH_COMMIT_MESSAGE=""

if [[ $# -gt 0 ]]; then
  shift
fi

if [[ $# -gt 0 ]]; then
  POST_PUBLISH_COMMIT_MESSAGE="$1"
  shift
fi

PUBLISH_ARGS=("$@")

echo "==> 当前分支: ${CURRENT_BRANCH}"
echo "==> 执行 pnpm build:lib"
pnpm build:lib

echo "==> 提交发布前变更"
git add -A

if git diff --cached --quiet; then
  echo "==> 没有可提交的变更，跳过预发布 commit"
else
  git commit -m "${PRE_PUBLISH_COMMIT_MESSAGE}"
fi

if [[ ${#PUBLISH_ARGS[@]} -gt 0 ]]; then
  echo "==> 执行 pnpm publish ${PUBLISH_ARGS[*]}"
  pnpm publish "${PUBLISH_ARGS[@]}"
else
  echo "==> 执行 pnpm publish"
  pnpm publish
fi

UPDATED_PACKAGE_VERSION="$(node -p "require('./package.json').version")"
FINAL_COMMIT_MESSAGE="${POST_PUBLISH_COMMIT_MESSAGE:-release: v${UPDATED_PACKAGE_VERSION}}"

echo "==> 提交发布后的版本变更"
git add package.json package-lock.json pnpm-lock.yaml

if git diff --cached --quiet; then
  echo "==> 没有发布后版本变更，跳过版本提交"
else
  git commit -m "${FINAL_COMMIT_MESSAGE}"
fi

echo "==> 推送到 origin/${CURRENT_BRANCH}"
git push origin "${CURRENT_BRANCH}"

echo "==> 完成"
