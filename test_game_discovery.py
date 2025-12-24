import sys
sys.path.insert(0, 'services/ai')

from games.registry import game_registry

# Discover all games
game_registry.discover_games()

# Get count
total = game_registry.count()
print(f"✅ Total: {total} games discovered\n")

# List all games
games = sorted(game_registry.list_games(), key=lambda x: x['id'])

for i, g in enumerate(games, 1):
    print(f"{i:2}. {g['id']:25} - {g['name']}")

print(f"\n{'='*50}")
print(f"Expected: 15 games")
print(f"Actual:   {total} games")
print(f"Status:   {'✅ PASS' if total == 15 else '❌ FAIL'}")
