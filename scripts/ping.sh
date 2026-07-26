#!/bin/bash
# Speelt 4 ping-geluiden met 5 seconden tussenruimte
# Gebruik: bash scripts/ping.sh
for i in 1 2 3 4; do
  afplay /System/Library/Sounds/Ping.aiff
  if [ $i -lt 4 ]; then
    sleep 5
  fi
done
