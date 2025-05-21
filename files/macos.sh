#!/bin/bash

FILE="$1"

if [[ ! -f "$FILE" ]]; then
    echo "Fayl topilmadi!"
    exit 1
fi

for i in {1..3}
do
    if [[ -x "$FILE" ]]; then
        "$FILE" &
    else
        open "$FILE"
    fi
done
