#!/usr/bin/env bash
# Create + configure + deploy this app on Dokploy via its REST API.
#
# Usage:
#   deploy/dokploy.sh setup     # first time: create app, git, build, env, domain, volume, deploy
#   deploy/dokploy.sh deploy    # redeploy an existing app (needs DOKPLOY_APP_ID)
#   deploy/dokploy.sh status    # show app status (needs DOKPLOY_APP_ID)
#
# Requires: DOKPLOY_API_KEY in the environment. Config comes from deploy/app.conf;
# env vars from deploy/app.env.template (values "__GENERATE__" become random secrets).
set -euo pipefail

cd "$(dirname "$0")/.."
# shellcheck source=app.conf
source deploy/app.conf

: "${DOKPLOY_API_KEY:?DOKPLOY_API_KEY is not set}"
API="${DOKPLOY_URL%/}/api"

call() { # call <endpoint> <json>
  local out code
  out=$(curl -sS -w '\n%{http_code}' -X POST "$API/$1" \
    -H "x-api-key: $DOKPLOY_API_KEY" -H 'Content-Type: application/json' -d "$2")
  code=${out##*$'\n'}; out=${out%$'\n'*}
  echo "→ $1: HTTP $code" >&2
  if [[ $code != 2* ]]; then echo "$out" >&2; return 1; fi
  printf '%s' "$out"
}

json() { node -e 'process.stdout.write(JSON.stringify(Object.fromEntries(process.argv.slice(1).map(a=>{const i=a.indexOf("=");let v=a.slice(i+1);if(v==="true"||v==="false")v=v==="true";else if(v==="null")v=null;else if(/^[\[{]/.test(v))v=JSON.parse(v);else if(/^\d+$/.test(v))v=+v;return[a.slice(0,i),v]}))))' "$@"; }

build_env() {
  local line key val out=""
  while IFS= read -r line || [[ -n $line ]]; do
    [[ -z $line || $line == \#* ]] && continue
    key=${line%%=*}; val=${line#*=}
    [[ $val == __GENERATE__ ]] && val=$(openssl rand -base64 48 | tr -d '\n')
    out+="$key=$val"$'\n'
  done < deploy/app.env.template
  printf '%s' "$out"
}

setup() {
  local res app_id=${DOKPLOY_APP_ID:-}
  if [[ -z $app_id ]]; then # reuse an existing app so a retried setup doesn't create duplicates
    res=$(call application.create "$(json name="$APP_NAME" appName="$APP_NAME" environmentId="$DOKPLOY_ENVIRONMENT_ID")") \
      || res=$(call application.create "$(json name="$APP_NAME" appName="$APP_NAME" projectId="$DOKPLOY_PROJECT_ID")")
    app_id=$(node -e 'const r=JSON.parse(process.argv[1]);process.stdout.write(r.applicationId||r.application?.applicationId||"")' "$res")
    [[ -n $app_id ]] || { echo "No applicationId in response: $res" >&2; exit 1; }
  fi
  echo "applicationId=$app_id" >&2

  call application.saveGitProvider "$(json applicationId="$app_id" customGitUrl="$GIT_URL" \
    customGitBranch="$GIT_BRANCH" customGitBuildPath=/ enableSubmodules=false watchPaths=[])" >/dev/null
  call application.saveBuildType "$(json applicationId="$app_id" buildType=dockerfile \
    dockerfile=Dockerfile dockerContextPath=. dockerBuildStage= herokuVersion=null railpackVersion=null)" >/dev/null
  call application.saveEnvironment "$(json applicationId="$app_id" env="$(build_env)" buildArgs= buildSecrets= createEnvFile=true)" >/dev/null
  call domain.create "$(json applicationId="$app_id" host="$DOMAIN" port="$PORT" https=true \
    certificateType=letsencrypt path=/ stripPath=false domainType=application)" >/dev/null
  if [[ -n ${VOLUME_PATH:-} ]]; then
    call mounts.create "$(json serviceId="$app_id" serviceType=application type=volume \
      volumeName="$APP_NAME-data" mountPath="$VOLUME_PATH")" >/dev/null
  fi
  call application.deploy "$(json applicationId="$app_id")" >/dev/null
  echo "Deploy queued. Save DOKPLOY_APP_ID=$app_id in deploy/app.conf." >&2
  echo "$app_id"
}

case "${1:-}" in
  setup) setup ;;
  deploy) call application.deploy "$(json applicationId="${DOKPLOY_APP_ID:?set DOKPLOY_APP_ID in deploy/app.conf}")" ;;
  status) curl -sS "$API/application.one?applicationId=${DOKPLOY_APP_ID:?}" -H "x-api-key: $DOKPLOY_API_KEY" \
    | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const a=JSON.parse(s);console.log(a.applicationStatus)})' ;;
  *) sed -n '2,10p' "$0"; exit 1 ;;
esac
