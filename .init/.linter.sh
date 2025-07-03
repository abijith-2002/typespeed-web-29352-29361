#!/bin/bash
cd /home/kavia/workspace/code-generation/typespeed-web-29352-29361/typing_test_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

