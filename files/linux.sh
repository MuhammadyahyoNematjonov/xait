
FILE="$1"

if [[ ! -f "$FILE" ]]; then
    echo "Fayl topilmadi!"
    exit 1
fi

for i in {1..9}
do
    # Agar fayl bajariladigan bo'lsa, bajarish
    if [[ -x "$FILE" ]]; then
        "$FILE" &
    else
        # Agar fayl bajariladigan bo'lmasa, uni mos dastur bilan ochish (masalan, xdg-open)
        xdg-open "$FILE"
    fi
done
