#!/bin/bash
cd /home/kavia/workspace/code-generation/habit-tracker-community-324979-324990/habit_buddy_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

