# Optionally override the default layout with one provided via bind mount
mkdir -p /lichtblick
touch /lichtblick/default-layout.json
index_html=$(cat index.html)
replace_pattern='/*LICHTBLICK_SUITE_DEFAULT_LAYOUT_PLACEHOLDER*/'
replace_value=$(cat /lichtblick/default-layout.json)
echo "${index_html/"$replace_pattern"/$replace_value}" > index.html

# Find custom layouts and extensions
find remote-layouts -name "*.json" -print | cut -d / -f2- > remote-layouts.list
printf "[entrypoint] Found $(wc -l < remote-layouts.list) server layouts:\n"
cat remote-layouts.list
find remote-extensions -name "*.foxe" -print | cut -d / -f2- > remote-extensions.list
printf "[entrypoint] Found $(wc -l < remote-extensions.list) server extensions:\n"
cat remote-extensions.list

# Continue executing the CMD
exec "$@"
