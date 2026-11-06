#!/bin/sh
# 使い方: sh test/run.sh test/test-battle.js
cd "$(dirname "$0")/.."
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
FILES=$(grep -o 'src="js/[^"]*"' index.html | sed 's/src="//;s/"//')
exec $JSC test/dom-stub.js $FILES test/helpers.js "$@"
